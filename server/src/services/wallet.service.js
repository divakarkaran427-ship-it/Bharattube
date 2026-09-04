const Wallet = require("../models/wallet.model");
const Transaction = require("../models/transaction.model");

const creditWallet = async ({
  creatorId,
  amount,
  source,
  description = "",
  referenceId = null,
  session = null,
}) => {
  const wallet = await Wallet.findOne({
    creator: creatorId,
  }).session(session);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  wallet.availableBalance += amount;
  wallet.lifetimeEarnings += amount;
  wallet.lastTransactionAt = new Date();

  await wallet.save({ session });

  await Transaction.create(
    [
      {
        creator: creatorId,
        type: "credit",
        amount,
        balanceAfterTransaction: wallet.availableBalance,
        source,
        referenceId,
        description,
      },
    ],
    { session }
  );

  return wallet;
};

const debitWallet = async ({
  creatorId,
  amount,
  source,
  description = "",
  referenceId = null,
  session = null,
}) => {
  const wallet = await Wallet.findOne({
    creator: creatorId,
  }).session(session);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.availableBalance < amount) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.availableBalance -= amount;
  wallet.totalWithdrawn += amount;
  wallet.lastTransactionAt = new Date();

  await wallet.save({ session });

  await Transaction.create(
    [
      {
        creator: creatorId,
        type: "debit",
        amount,
        balanceAfterTransaction: wallet.availableBalance,
        source,
        referenceId,
        description,
      },
    ],
    { session }
  );

  return wallet;
};

module.exports = {
  creditWallet,
  debitWallet,
};