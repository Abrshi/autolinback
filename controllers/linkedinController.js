import axios from "axios";
import { PrismaClient } from "@prisma/client";

export const linkedinRedirect = (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;
  const state = "randomString123"; // generate dynamically per session in real app
  const scope = "r_liteprofile r_emailaddress w_member_social offline_access";

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${state}`;
  res.redirect(url);
};
export const rewritePost = async (req, res) => {
  const { postContent } = req;  // ✅ FIXED

  console.log("Received post content:", postContent);

  if (!postContent) {
    return res.status(400).json({ error: "postContent is required" });
  }

  try {
    // Call to AI rewriting service (pseudo-code)
    const rewrittenContent = await aiRewriteService(postContent);
    return res.status(200).json({ rewrittenContent });
  } catch (error) {
    console.error("AI Rewrite error:", error.message);
    return res.status(500).json({ error: "Failed to rewrite post" });
  }
};

export const linkedinCallback = async (req, res) => {
  const code = req.query.code;
  const userId = req.user.id; // from authenticate middleware

  try {
    // Exchange code for access token
    const tokenResp = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, expires_in } = tokenResp.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Get LinkedIn profile ID
    const profileResp = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const providerUserId = profileResp.data.id;

    // Upsert account
    await prisma.account.upsert({
      where: { providerUserId },
      update: { accessToken: access_token, expiresAt },
      create: {
        provider: "linkedin",
        providerUserId,
        accessToken: access_token,
        expiresAt,
        userId,
      },
    });

    res.send("LinkedIn connected successfully ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("LinkedIn OAuth failed");
  }
};

export const postToLinkedIn = async (req, res) => {
  const userId = req.user.id;
  const { text } = req.body;

  try {
    const account = await prisma.account.findFirst({
      where: { userId, provider: "linkedin" },
    });

    if (!account) return res.status(400).json({ message: "LinkedIn not connected" });

    await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: `urn:li:person:${account.providerUserId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      },
      { headers: { Authorization: `Bearer ${account.accessToken}` } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ message: "Failed to post to LinkedIn" });
  }
};

export const linkedinPoster = async (req, res) => {
  const { postContent } = req.body.postContent;
  const userId = req.user.id;
}