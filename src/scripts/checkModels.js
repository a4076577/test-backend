import dotenv from "dotenv";
dotenv.config();
const key = process.env.GOOGLE_API_KEY || "";
console.log("apikey:", key);
const url = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;

const run = async () => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
};

run();
