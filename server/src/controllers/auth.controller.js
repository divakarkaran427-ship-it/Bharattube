const User = require("../models/user.model");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const GOOGLE_STATE_COOKIE = "bharattube_google_oauth_state";

const getGoogleConfig = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, CLIENT_URL } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL || !CLIENT_URL) {
    throw new ApiError(500, "Google authentication is not configured");
  }

  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, CLIENT_URL };
};

const getGoogleClient = () => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = getGoogleConfig();
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);
};

const redirectToGoogleCallback = (res, clientUrl, params) => {
  const redirectUrl = new URL("/auth/google/callback", clientUrl);

  Object.entries(params).forEach(([key, value]) => {
    redirectUrl.searchParams.set(key, value);
  });

  return res.redirect(redirectUrl.toString());
};

const createGoogleUsername = async (email) => {
  const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14) || "creator";
  let username = baseUsername;

  while (await User.exists({ username })) {
    username = `${baseUsername.slice(0, 14)}${crypto.randomBytes(3).toString("hex")}`;
  }

  return username;
};

// =========================
// SIGNUP
// =========================

const signup = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  const user = await User.create({
    name,
    username,
    email,
    password,
  });

  const token = user.generateToken();

  return res.status(201).json(
    new ApiResponse(201, "Account created successfully", {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    })
  );
});

// =========================
// LOGIN
// =========================

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password && user.googleId) {
    throw new ApiError(401, "Please continue with Google to sign in");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = user.generateToken();

  return res.status(200).json(
    new ApiResponse(200, "Login successful", {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    })
  );
});

// =========================
// LOGOUT
// =========================

const logout = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Logout successful")
  );
});

// =========================
// GET CURRENT USER
// =========================

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, "Current user fetched successfully", user)
  );
});

// =========================
// GOOGLE OAUTH
// =========================

const startGoogleLogin = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  const googleClient = getGoogleClient();

  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60 * 1000,
    path: "/api/v1/auth/google",
  });

  const authorizationUrl = googleClient.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: ["openid", "email", "profile"],
    state,
  });

  return res.redirect(authorizationUrl);
});

const completeGoogleLogin = asyncHandler(async (req, res) => {
  const { CLIENT_URL, GOOGLE_CLIENT_ID } = getGoogleConfig();
  const { code, state, error } = req.query;

  if (error) {
    return redirectToGoogleCallback(res, CLIENT_URL, { error: "google_login_cancelled" });
  }

  const storedState = req.cookies[GOOGLE_STATE_COOKIE];
  res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/api/v1/auth/google" });

  if (!code || !state || !storedState || state.length !== storedState.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(storedState))) {
    return redirectToGoogleCallback(res, CLIENT_URL, { error: "google_login_failed" });
  }

  const googleClient = getGoogleClient();
  const { tokens } = await googleClient.getToken(code);

  if (!tokens.id_token) {
    return redirectToGoogleCallback(res, CLIENT_URL, { error: "google_login_failed" });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });
  const googleUser = ticket.getPayload();

  if (!googleUser?.sub || !googleUser.email || !googleUser.email_verified) {
    return redirectToGoogleCallback(res, CLIENT_URL, { error: "google_email_not_verified" });
  }

  let user = await User.findOne({ googleId: googleUser.sub });

  if (!user) {
    user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (user?.googleId && user.googleId !== googleUser.sub) {
      return redirectToGoogleCallback(res, CLIENT_URL, { error: "google_account_conflict" });
    }

    if (user) {
      user.googleId = googleUser.sub;
      if (!user.profilePhoto && googleUser.picture) user.profilePhoto = googleUser.picture;
      await user.save();
    } else {
      user = await User.create({
        name: googleUser.name || googleUser.email.split("@")[0],
        username: await createGoogleUsername(googleUser.email),
        email: googleUser.email.toLowerCase(),
        googleId: googleUser.sub,
        profilePhoto: googleUser.picture || "",
      });
    }
  }

  const token = user.generateToken();
  return redirectToGoogleCallback(res, CLIENT_URL, { token });
});

module.exports = {
  signup,
  login,
  logout,
  getCurrentUser,
  startGoogleLogin,
  completeGoogleLogin,
};
