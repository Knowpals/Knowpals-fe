import request from '../utils/request';

// 用户密码登录
export const loginByPassword = (data) => request.post('/user/loginByPassword', data);

// 用户验证码登录
export const loginByCode = (data) => request.post('/user/loginByCode', data);

// 发送验证码
export const sendCode = (data) => request.post('/user/sendCode', data);

// 用户注册
export const register = (data) => request.post('/user/register', data);

// 忘记密码
export const forgotPassword = (data) => request.post('/user/forgotPassword', data);

// 获取用户信息
export const getUserInfo = () => request.get('/user/getUserInfo');
