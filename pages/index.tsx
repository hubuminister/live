import { Button, DotLoading, Picker } from "antd-mobile";
import { NextPageContext } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import useSWR from "swr";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface User {
  name: string;
  _id: string;
  uid: number;
}

type Props = {
  users: User[];
};

export default function Home({ users }: Props) {
  // return (
  //   <div className="w-full min-h-screen flex justify-center items-center flex-col">
  //     <span>暂停服务了,有缘再相会.</span>
  //   </div>
  // );

  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [showPicker, setShowPicker] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const {
    data,
    isLoading,
    mutate: run,
  } = useSWR(selectedUser, (k) => {
    return fetch(`/api/info?id=${selectedUser?.uid}`).then((r) => r.json());
  });

  useEffect(() => {
    run();
  }, [selectedUser]);

  return (
    <div className="w-full min-h-screen flex justify-center items-center flex-col">
      <div className="flex items-center justify-center gap-2">
        <Button onClick={() => setShowPicker(true)}>选择主播</Button>
        <Picker
          columns={[
            users.map((user) => {
              return {
                label: user.name,
                value: user.name,
              };
            }),
          ]}
          visible={showPicker}
          onCancel={() => setShowPicker(false)}
          onClose={() => setShowPicker(false)}
          onConfirm={(v) => {
            if (v.length === 0) return;
            if (v[0] === null) return;
            const user = users.find((u) => u.name === v[0]);
            setSelectedUser(user);
          }}
        />
        <div>{selectedUser?.name}</div>
      </div>
      {isLoading && <DotLoading className="mt-5" />}
      {data && data.error && <div className="text-2xl mt-4">{data.error}</div>}
      {data && !data.error && (
        <div className="text-xl mt-4 w-full">
          <div className="flex flex-col justify-center items-center w-full">
            <div className="w-full justify-center items-center flex">
              <Image
                className="rounded-full"
                src={data.avatar}
                width={80}
                height={80}
                alt="头像"
              />
            </div>
            <span>用户名:{data.name}</span>
            {(!data || !data.consume) && (
              <div className="flex justify-center items-center w-full">
                <span>尚未开播，无法查询榜单信息</span>
              </div>
            )}
            {data.total && (
              <div className="w-full flex flex-col items-center justify-center">
                <span>当月总榜:{data.total} 豆</span>
                <span className="text-xs ml-5">
                  仅计算榜单信息,未包含注销账户.
                </span>
                <span>
                  预估收入:
                  {((data.total / 10) * 0.57).toFixed(2)} 元
                </span>
                <span className="text-xs ml-5">按照57%计佣</span>
              </div>
            )}
            {data && data.consume && (
              <div className="mt-2 flex flex-col w-full">
                <span className=" font-bold">月榜</span>
                <table className="w-full">
                  <tbody className="w-full">
                    <tr className="w-full border">
                      <td align="center" width={"15%"}>
                        排名
                      </td>
                      <td align="center" width={"50%"}>
                        用户名
                      </td>
                      <td align="center" width={"35%"}>
                        豆子
                      </td>
                    </tr>
                    {data.consume.map(
                      (item: { name: string; beans: string }, idx: number) => {
                        if (idx > 4) return null;
                        return (
                          <tr key={idx} className="w-full border">
                            <td align="center" width={"15%"}>
                              {idx + 1}
                            </td>
                            <td align="center" width={"50%"}>
                              {item.name}
                            </td>
                            <td align="center" width={"35%"}>
                              {parseInt(item.beans)} 豆
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>

                <span className=" font-bold">当前场次榜单</span>
                {data.liveshow && (
                  <span className="text-md">
                    开播时间:{" "}
                    {dayjs(data.liveshow.start_time * 1000).format("HH:mm:ss")}{" "}
                    时长:{" "}
                    {dayjs(now).diff(
                      data.liveshow.start_time * 1000,
                      "minutes"
                    )}
                    分钟
                  </span>
                )}
                <span>{data.currentTotal} 豆</span>
                <table className="w-full">
                  <tbody className="w-full">
                    <tr className="w-full border">
                      <td align="center" width={"15%"}>
                        排名
                      </td>
                      <td align="center" width={"50%"}>
                        用户名
                      </td>
                      <td align="center" width={"35%"}>
                        豆子
                      </td>
                    </tr>
                    {data.currentConsume.map(
                      (item: { name: string; beans: string }, idx: number) => {
                        if (idx > 4) return null;
                        return (
                          <tr key={idx} className="w-full border">
                            <td align="center" width={"15%"}>
                              {idx + 1}
                            </td>
                            <td align="center" width={"50%"}>
                              {item.name}
                            </td>
                            <td align="center" width={"35%"}>
                              {parseInt(item.beans)} 豆
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import clientPromise from "@/lib/db";
export async function getServerSideProps(ctx: NextPageContext) {
  try {
    const client = await clientPromise;
    const db = client.db("blued-live");
    const collection = db.collection("anchor");
    const result = await collection.find<User>({}).toArray();
    const users = result.map((user) => {
      return {
        id: user._id.toString(),
        name: user.name,
        uid: user.uid,
      };
    });
    return {
      props: {
        users,
      },
    };
  } catch (error) {
    return {
      props: {
        users: [],
      },
    };
  }
}
