# 知伴 (ZhiBan) 统一前端

学生端 + 教师端整合前端项目，Vite + React + Ant Design。

## 技术栈

| 技术 | 版本 |
|------|------|
| React | 19.x |
| React Router DOM | 7.x |
| Ant Design | 6.x |
| Axios | 1.x |
| ECharts | 6.x |
| Vite | 8.x |

## 项目结构

```
src/
├── App.jsx                       # 根组件，路由分发
├── main.jsx                      # 入口
├── index.css                     # 全局样式
│
├── routes/
│   ├── teacherRoutes.jsx         # 教师端路由（12条）
│   └── studentRoutes.jsx         # 学生端路由（10条）
│
├── components/
│   └── AuthGuard.jsx             # 角色守卫，按角色拦截路由
│
├── layouts/
│   ├── TeacherLayout.jsx         # 教师端布局
│   └── StudentLayout.jsx         # 学生端布局（底部3标签导航）
│
├── pages/
│   ├── Login.jsx                 # 登录页（共用）
│   ├── Register.jsx              # 注册页（共用）
│   ├── teacher/                  # 教师端页面（12个）
│   └── student/                  # 学生端页面（10个）
│
├── services/
│   ├── authApi.js                # 登录/注册/验证码/忘记密码
│   ├── teacherApi.js             # 教师端 API
│   └── studentApi.js             # 学生端 API
│
└── utils/
    └── request.js                # 统一 axios 实例（拦截器/错误处理）
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 角色区分

项目通过路由守卫 `AuthGuard` 区分学生/教师角色：

- 学生登录后只能访问 `pages/student/*` 下的页面
- 教师登录后只能访问 `pages/teacher/*` 下的页面
- 未登录用户重定向到登录页

## Git 协同规范

### 分支策略

```
main
├── feat/unified-frontend-base    # 基础整合分支
├── feat/student-frontend         # 学生端开发
└── feat/teacher-frontend         # 教师端开发
```

### 文件归属

| 负责方 | 文件范围 |
|--------|----------|
| **学生端** | `pages/student/*`, `routes/studentRoutes.jsx`, `services/studentApi.js`, `layouts/StudentLayout.jsx` |
| **教师端** | `pages/teacher/*`, `routes/teacherRoutes.jsx`, `services/teacherApi.js`, `layouts/TeacherLayout.jsx` |

### 开发流程

1. 从 `main` 或 `feat/unified-frontend-base` 开出自己的 feature 分支
2. 只修改自己负责的文件范围
3. 提交 PR 让另一方 review
4. 避免修改共用文件（`Login.jsx`, `Register.jsx`, `AuthGuard.jsx`, `request.js` 等），如有需要先沟通
