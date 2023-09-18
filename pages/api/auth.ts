// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";

interface AuthToken {
  token: string;
  _id: ObjectId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      res.status(400).json({ error: "参数错误" });
      return;
    }
    const client = await clientPromise;
    const db = client.db("blued-live");
    const collection = db.collection("auth");
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: "参数错误" });
      return;
    }
    const exist = (await collection.find<AuthToken>({}).toArray()).pop();
    if (exist) {
      await collection.updateOne(
        { _id: exist._id },
        { $set: { token: token } }
      );
    } else {
      await collection.insertOne({ token: token });
    }

    res.status(200).json({ error: "请求成功" });
  } catch (error) {
    return res.status(500).json({ error: "服务器错误" });
  }
}
