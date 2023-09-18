// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import clientPromise from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  console.log(req.headers);
  console.log(req.body);
  
  


  const method = req.method;
  try {
    const client = await clientPromise;
    const db = client.db("blued-live");
    const collection = db.collection("anchor");

    switch (method) {
      case "POST":
        const { uid, name }: { uid: number; name: string } = req.body;
        if (!uid || !name) {
          res.status(400).json({ error: "参数错误" });
          return;
        }
        const exist = await collection.findOne({ uid });
        if (exist) {
          res.status(200).json({ error: "已存在" });
          return;
        }
        await collection.insertOne({ uid, name });
        res.status(201).json({ message: "添加成功" });
        return;
      case "DELETE":
        const { uid: deleteUid }: { uid: number } = req.body;
        if (!deleteUid) {
          res.status(400).json({ error: "参数错误" });
          return;
        }
        await collection.deleteOne({ uid: deleteUid });
        res.status(200).json({ message: "删除成功" });
        return;

      case "GET":
        if (!req.query["uid"]) {
          res.status(400).json({ msg: "参数错误" });
          return;
        }
        const anchor = await collection.findOne({
          uid: Number(req.query["uid"]),
        });
        if (!anchor) {
          res.status(404).json({ error: "未找到" });
          return;
        }
        res.status(200).json(anchor);
        return;

      case "PUT":
        const {
          uid: putUid,
          edit: { uid: editedUid, name: editedName },
        }: { uid: number; edit: { uid?: number; name?: string } } = req.body;
        if (!putUid) {
          res.status(400).json({ error: "参数错误" });
          return;
        }
        const putAnchor = await collection.findOne({ uid: Number(putUid) });
        if (!putAnchor) {
          res.status(404).json({ error: "未找到" });
          return;
        }
        if (editedUid) {
          await collection.updateOne(
            { uid: Number(putUid) },
            { $set: { uid: Number(editedUid) } }
          );
        }
        if (editedName) {
          await collection.updateOne(
            { uid: Number(putUid) },
            { $set: { name: editedName } }
          );
        }
        res.status(200).json({ message: "修改成功" });
        return;

      default:
        res.end();
        break;
    }
  } catch (error) {
    res.status(500).json({ error: "服务错误" });
  }
}
