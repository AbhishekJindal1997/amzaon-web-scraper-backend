import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import { adminDB } from "./firebaseAdmin";

require("dotenv").config();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const fetchResults: any = async (id: string) => {
  const apiKey = process.env.BRIGHTDATA_API_KEY;

  const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await res.json();

  if (data.status === "building" || data.status === "collecting") {
    console.log("NOT COMPLETE YET, TRY AGAIN....");
    return fetchResults(id);
  }

  return data;
};

export const onScraperComplete = functions.https.onRequest(
  async (request, response) => {
    console.log("Scrape Started", request.body);

    const { success, id, finished } = request.body;

    if (!success) {
      await adminDB.collection("searches").doc(id).set(
        {
          status: "error",
          updatedAt: finished,
        },
        {
          merge: true,
        }
      );
    }
    console.log("fetching results");
    const data = await fetchResults(id);

    await adminDB.collection("searches").doc(id).set(
      {
        status: "complete",
        updatedAt: finished,
        results: data,
      },
      { merge: true }
    );

    response.send("Scraping Function Finished!");
  }
);

// https://948c-2607-fea8-1d06-3a00-249f-8bca-526b-8196.ngrok-free.app
