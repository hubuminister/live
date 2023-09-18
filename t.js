if ($request.headers.Authorization) {
  updateAuth().catch((err) => {
    $notification.post("更新失败", "", JSON.stringify(err));
  });
}

$notification.post(
  "命中",
  $response.body.data[0].user.name,
  $response.body.data[0].user.uid
);
$done({});

async function updateAuth() {
  const body = {
    token: $request.headers.Authorization,
  };
  return await $httpClient.post(
    "https://live.597.icu/api/auth",
    body,
    (err, res, data) => {
      if (err) {
        $notification.post("更新失败", "", JSON.stringify(err));
        return;
      }
      $notification.post("更新成功", "", JSON.stringify(data));
    }
  );
}
