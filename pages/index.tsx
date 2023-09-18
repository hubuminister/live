import { Button, DotLoading, Picker } from "antd-mobile";
import Image from "next/image";
import { useEffect, useState } from "react";
import useSWR from "swr";

export default function Home() {
  const allUser: { [key: string]: number } = {
    派大星: 97693327,
    远良: 6607184,
    蛋蛋: 92976420,
    等等: 72174263,
    八尺: 77767285,
    山谷: 93680849,
    星星: 2357659,
    承诺: 60370002,
    左耳: 3231851,
    沐阳: 93465089,
    豆豆: 17733794,
    有酒: 4372883,
    N先生: 70349950,
    痞憨憨: 31959031,
    DC墩墩: 32074790,
    西门: 96867197,
    黑子涛: 42858456,
    老舅: 4707945,
    陶大宝: 53050163,
    小灰灰: 94377592,
    土豆BB: 96115420,
    韩乖乖: 29872049,
    小胖饿瘦了: 86253971,
    铭洋音乐: 40453885,
    南山二哥: 15946625,
    萝莉大叔: 40634639,
    北国风云: 90068978,
    seven瑞:30875614,
    猪祝朱:92606488
  };

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [showPicker, setShowPicker] = useState(false);

  const {
    data,
    isLoading,
    mutate: run,
  } = useSWR(selectedUser, (k) => {
    return fetch(`/api/info?id=${allUser[selectedUser]}`).then((r) => r.json());
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
            Object.keys(allUser).map((key) => ({
              label: key,
              value: key,
            })),
          ]}
          visible={showPicker}
          onCancel={() => setShowPicker(false)}
          onClose={() => setShowPicker(false)}
          onConfirm={(v) => {
            if (v.length === 0) return;
            // @ts-ignore
            setSelectedUser(v[0]);
          }}
        />
        <div>{selectedUser}</div>
      </div>
      {isLoading && <DotLoading />}
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
