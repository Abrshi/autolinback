import { PrismaClient } from "@prisma/client";
import axios from "axios";
const prisma = new PrismaClient();




export const signUp = async (req, res) => {
};

export const titleGenerator = async (req, res) => {
  const { keywored, nextPage } = req.body;

  if (!keywored) {
    return res.status(400).json({ error: "keywored is required" });
  }

  try {
    const response = await axios.get("https://newsdata.io/api/1/news", {
      params: {
        apikey: process.env.NEWSDATA_API_KEY,
        q: keywored,
        language: "en",       // optional: filter by language
       // page: nextPage || 1,  // first request uses 1
      },
    });

    // Return only results + nextPage token
    return res.status(200).json({
      success: true,
      keyword: keywored,
      news: response.data.results || [],
      nextPage: response.data.nextPage || null,
    });
  } catch (error) {
    console.error("NewsData API error:", error?.response?.data || error.message);
    return res.status(500).json({
      error: "Failed to fetch news",
      details: error?.response?.data || error.message,
    });
  }
};
// ---------------- Refresh Token ----------------
export const refreshToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token provided" });

  try {
    const hashedToken = hashToken(token);

    const session = await prisma.session.findFirst({
      where: { refreshToken: hashedToken },
      include: { user: true },
    });

    if (!session)
      return res.status(403).json({ error: "Refresh token is invalid or expired" });

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken();
    const newHashedToken = hashToken(newRefreshToken);

    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newHashedToken },
    });

    const accessToken = generateAccessToken(session.user);

    res
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({ accessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ error: "Internal server error during token refresh" });
  }
};

// ---------------- Logout ----------------
export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);

  try {
    const hashedToken = hashToken(refreshToken);
    await prisma.session.deleteMany({ where: { refreshToken: hashedToken } });
    res.clearCookie("refreshToken", cookieOptions);
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Internal server error during logout" });
  }
};
