const mongoose = require("mongoose");

const Earning = require("../models/earning.model");
const { creditWallet } = require("./wallet.service");

// ==========================================
// Credit Creator Earnings
// ==========================================

const creditEarning = async ({
  creatorId,
  source,
  sourceId,
  amount,
  views = 0,
  rpm = 0,
  description = "",
}) => {
  if (amount <= 0) {
    throw new Error("Invalid earning amount.");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create earning record
    const earning = await Earning.create(
      [
        {
          creator: creatorId,
          source,
          sourceId,
          amount,
          views,
          rpm,
          currency: "INR",
          status: "approved",
          description,
        },
      ],
      { session }
    );

    // Credit wallet
    await creditWallet({
      creatorId,
      amount,
      source,
      referenceId: earning[0]._id,
      description,
      session,
    });

    // Mark as paid
    earning[0].status = "paid";
    await earning[0].save({ session });

    await session.commitTransaction();

    return earning[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  creditEarning,
};