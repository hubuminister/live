// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import IP2Region from "ip2region";
import type { NextApiRequest, NextApiResponse } from "next";
import axios, { isAxiosError } from "axios";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";
import dayjs from "dayjs";

interface Token {
  token: string;
  _id: ObjectId;
}

const geoIp2 = new IP2Region();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const geo = geoIp2.search(
      typeof req.headers["x-real-ip"] === "string"
        ? req.headers["x-real-ip"]
        : req.headers["x-real-ip"]?.[0] || ""
    );
    const client = await clientPromise;
    const db = client.db("blued-live");
    const collection = db.collection("auth");
    const token = await collection.find<Token>({}).toArray();
    if (!token.length)
      return res
        .status(404)
        .json({ error: "授权信息过期,请联系管理更新授权." });

    const api = axios.create({
      timeout: 3000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Mobile Safari/537.36",
        Authorization: token[0].token,
      },
    });

    const apis = {
      info: (uid: number) =>
        api.get(
          `https://argo.blued.cn/users/${uid}?is_living=false&is_call=0&is_shadow=0&is_vip_page=0`
        ),
      userinfo: (uid: number) =>
        api.get(
          `https://live.blued.cn/live/user/card?anchor=${uid}&uid=${uid}`
        ),
      consumes: (uid: number, lid: number, page: number = 1) =>
        api.get(
          `https://live.blued.cn/live/stars/${uid}/consumes?page=${page}&lid=${lid}&type=month`
        ),
      currentConsume: (uid: number, lid: number, page: number = 1) =>
        api.get(
          `https://live.blued.cn/live/stars/${uid}/consumes/${lid}?page=${page}`
        ),
    };

    const { data } = await apis.info(Number(req.query.id));
    if (data.code !== 200) return res.status(404).json({ error: "Not found" });
    const resData: { [key: string]: any } = {
      name: data.data[0].name,
      avatar: data.data[0].raw_avatar,
    };
    console.log(
      `${dayjs().format("MM-DD HH:mm")} - ${req.headers["x-real-ip"]} ${
        geo?.city
      }${geo?.isp} - ${resData.name}`
    );

    if (data.data[0].live) {
      let page = 1;
      let consumes: any[] = [];
      let currentConsumes: any[] = [];
      while (page < 6) {
        const { data: consumeInfo } = await apis.consumes(
          Number(req.query.id),
          data.data[0].live,
          page
        );
        if (consumeInfo.code !== 200) break;
        consumes = consumes.concat(consumeInfo.data);
        const { data: currentConsumeInfo } = await apis.currentConsume(
          Number(req.query.id),
          data.data[0].live,
          page
        );
        if (currentConsumeInfo.code !== 200) break;
        currentConsumes = currentConsumes.concat(currentConsumeInfo.data);
        page++;
      }
      resData.consume = consumes;
      resData.currentConsume = currentConsumes;
      let total = 0;
      consumes.forEach((consume) => {
        total += parseInt(consume.beans);
      });
      resData.total = total;
      let currentTotal = 0;
      currentConsumes.forEach((consume) => {
        currentTotal += parseInt(consume.beans);
      });
      resData.currentTotal = currentTotal;
    }
    res.status(200).json(resData);
  } catch (error) {
    if (isAxiosError(error)) {
      return res.status(error?.response?.status || 500).json({
        error:
          error?.response?.data?.message === "Illegal request"
            ? "授权过期,请联系管理更新授权."
            : "" || "服务器错误",
      });
    }
    return res.status(500).json({ error: "服务器错误" });
  }
}
