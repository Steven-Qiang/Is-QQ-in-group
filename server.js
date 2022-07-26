/**
 * @file: server.js
 * @description: server.js
 * @package: Is-QQ-in-group
 * @create: 2022-07-26 09:53:51
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-07-26 10:34:50
 * -----
 */
const path = require('path');
const Koa = require('koa');
const Router = require('@koa/router');
const body = require('koa-body');
const static = require('koa-static');

const login = require('qq-login-qrcode');
const axios = require('axios').default;

const app = new Koa();
const router = new Router();

const appid = '715030901';

router.get('/api/get-qrcode', async (ctx) => (ctx.body = await login.getQrcode(appid)));
router.get('/api/get-result/:qrsig', async (ctx) => (ctx.body = await login.getResult(ctx.params.qrsig, appid)));
router.post('/api/group-list', async (ctx) => {
  const { skey, p_skey, uin, p_uin } = ctx.request.body;
  const resp = await axios.post('https://qun.qq.com/cgi-bin/qun_mgr/get_group_list', `bkn=${getCSRFToken(skey)}`, {
    headers: {
      cookie: `uin=${uin}; skey=${skey}; p_uin=${p_uin}; p_skey=${p_skey};`,
    },
  });
  if (resp.data.errcode != 0) {
    ctx.body = resp.data;
    return;
  }

  const group_list = [
    ...resp.data.create.map((x) => (((x.role = 'creator'), (x.roleName = '群主')), x)),
    ...resp.data.manage.map((x) => (((x.role = 'manager'), (x.roleName = '管理员')), x)),
    ...resp.data.join.map((x) => (((x.role = 'member'), (x.roleName = '群员')), x)),
  ];

  ctx.body = {
    errcode: 0,
    list: group_list,
  };
});

function getCSRFToken(skey) {
  if (skey) {
    for (var t = 5381, r = 0, n = skey.length; r < n; ++r) t += (t << 5) + skey.charAt(r).charCodeAt(0);
    return 2147483647 & t;
  }
}

app.use(body());
app.use(static(path.resolve('public')));
app.use(router.routes(), router.allowedMethods());

app.listen(3000, '0.0.0.0', () => {
  console.log('服务启动于: http://127.0.0.1:3000');
});
