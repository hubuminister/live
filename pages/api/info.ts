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
          "Mozilla/5.0 (iPad; iOS 16.6; Scale/2.00) iOS/140127_4.12.7_4331_057 (Asia/Shanghai) app/1",
        Authorization: token[0].token,
        Accept: "*/*",
        channel: "apple",
        "X-CLIENT-COLOR": "light",
        "Accept-Encoding": " gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept-Language": "zh-CN",
        ua: "Mozilla/5.0 (iPhone; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
        Cookie:
          "Accept-Language=zh-CN; X-CLIENT-COLOR=light; __Screen_W=750; app_version=7.21.4; channel=a0001i; dev_dna=D2PEMjFKOetCCaiPbcv2R8DQympHL4FHACylCO/7z1n6YX23; device=iPad8,6; lat=0; lon=0; native=1; net_op=unkonwn; screen_high=1334; timezone=Asia/Shanghai; token=ac7dcaa1ce7139469cd30044158e32a21cc5e334f6e2e028159088aded8d89766697ed50c9e0abae068797241c7efcfd07cda29e386f1387653601006a910e3eb5790d5f4d1b4efc5b8939765ecc3b4c89a55c25364e22ccd1713cd31b333887a3442a6cb43c2c64d09e997db194ad5c50a0cb77352b7103f41748ef028e0682b02ae3c425b4eaa8f1277c3c69b33bbc01d578a2336b0eda37a62b94ab23ca123d39a45e2f18eb7b5046d7b9fd9e0c815f1d254aa922ed508ce3232df4f3448f490c037e9e329e4e066752b662ddc0f11fbdc2c2576bdf16cfb8ec3f5345452dac3c5af5ac32b1962a5a9050353c2735e18e2c839f41c36dc34591e6e315eba256651383273eef7018862518709b8915d0acbad98fa80abb99ec8311afb40ada7358f396c25ce9f1bd3738e126fe5aba0ddf; uid=ac7d74e711a11e8b259481714bb75c4fa2cbf2310c8d82f1c2ca411df2bda1b47f46",
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
      获取直播流: (lid: number) =>
        api.post(`https://live.blued.cn/live/join`, {
          lid: lid.toString(),
          recommended_prop: 0,
          source: "",
        }),
    };

    const { data } = await apis.info(Number(req.query.id));
    if (data.code !== 200) return res.status(404).json({ error: "Not found" });
    const resData: { [key: string]: any } = {
      name: data.data[0].name,
      avatar: data.data[0].raw_avatar,
    };

    if (data.data[0].liveshow) {
      resData.liveshow = data.data[0].liveshow;
      if (data.data[0].liveshow.session_id) {
        try {
          const { data: liveInfo } = await apis.获取直播流(
            data.data[0].liveshow.session_id
          );
          if (liveInfo.data[0].live_url) {
            const code = liveInfo.data[0].live_url.split("/")[4];
            resData.live_url = `https://pili-live-hls.blued.cn/blued/${code}.m3u8`;
          }
        } catch (error) {
          console.log(error);
        }
      }
    }

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
