# ポモドーロタイマー システム設計書

## 1. システムアーキテクチャ

### 1.1 全体構成
```
┌──────────────────────────────────────────────────────────┐
│                    クライアント層                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │  Web App (PWA)   │  │  Mobile App     │           │
│  │  Next.js/React   │  │  React Native   │           │
│  └──────────────────┘  └──────────────────┘           │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                    API Gateway                            │
│              AWS API Gateway / Nginx                      │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                  アプリケーション層                        │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │   REST API      │  │  WebSocket      │           │
│  │   Node.js       │  │  Socket.io      │           │
│  └──────────────────┘  └──────────────────┘           │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│                     データ層                              │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │   PostgreSQL    │  │     Redis       │           │
│  │  (メインDB)     │  │  (キャッシュ)    │           │
│  └──────────────────┘  └──────────────────┘           │
└──────────────────────────────────────────────────────────┘
```

### 1.2 主要コンポーネント

#### フロントエンド (PWA)
- **フレームワーク**: Next.js 14 (App Router)
- **UIライブラリ**: React 18 + TypeScript
- **状態管理**: Zustand + React Query (TanStack Query)
- **UI/CSS**: Tailwind CSS + shadcn/ui
- **PWA機能**:
  - Service Worker (Workbox)
  - Web Push Notifications
  - Background Sync
  - Offline Support

#### バックエンド
- **APIサーバー**: Node.js + Express.js
- **リアルタイム通信**: Socket.io
- **認証**: JWT + OAuth2 (Google/GitHub)
- **ジョブキュー**: Bull (Redis-based)
- **ロギング**: Winston + Morgan

#### インフラ
- **ホスティング**: Vercel (Frontend) + AWS/Render (Backend)
- **CDN**: Cloudflare
- **監視**: Sentry + DataDog

## 2. データベーススキーマ

### 2.1 主要テーブル

```sql
-- ユーザー
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    auth_provider VARCHAR(50), -- 'local', 'google', 'github'
    password_hash VARCHAR(255), -- for local auth only
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- セッション（ポモドーロセッション）
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'work', 'short_break', 'long_break'
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    paused_duration_seconds INTEGER DEFAULT 0,
    tag_id UUID REFERENCES tags(id),
    task_id UUID REFERENCES tasks(id),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- タグ（カテゴリ）
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL, -- HEX color
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- タスク（軽量タスク管理）
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_pomodoros INTEGER DEFAULT 1,
    completed_pomodoros INTEGER DEFAULT 0,
    external_link TEXT, -- Trello/Notion/etc URL
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 統計サマリー（日次集計）
CREATE TABLE daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_focus_minutes INTEGER DEFAULT 0,
    completed_pomodoros INTEGER DEFAULT 0,
    total_break_minutes INTEGER DEFAULT 0,
    most_productive_hour INTEGER, -- 0-23
    tag_distribution JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- 共有セッション（リモートワーカー向け）
CREATE TABLE shared_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    share_code VARCHAR(20) UNIQUE NOT NULL,
    session_id UUID REFERENCES sessions(id),
    is_active BOOLEAN DEFAULT true,
    allow_join BOOLEAN DEFAULT false, -- 同期ポモドーロ許可
    participants JSONB DEFAULT '[]',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ユーザー設定（詳細）
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    work_duration INTEGER DEFAULT 25,
    short_break_duration INTEGER DEFAULT 5,
    long_break_duration INTEGER DEFAULT 15,
    sessions_until_long_break INTEGER DEFAULT 4,
    auto_start_breaks BOOLEAN DEFAULT false,
    auto_start_pomodoros BOOLEAN DEFAULT false,
    notification_sound VARCHAR(50) DEFAULT 'default',
    notification_volume INTEGER DEFAULT 70,
    theme VARCHAR(20) DEFAULT 'auto', -- 'light', 'dark', 'auto'
    keyboard_shortcuts JSONB DEFAULT '{}',
    strict_mode BOOLEAN DEFAULT false, -- ブロッキングモード
    daily_goal_pomodoros INTEGER DEFAULT 8,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 インデックス
```sql
CREATE INDEX idx_sessions_user_date ON sessions(user_id, started_at);
CREATE INDEX idx_sessions_tag ON sessions(tag_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);
CREATE INDEX idx_shared_sessions_code ON shared_sessions(share_code);
```

## 3. API設計

### 3.1 認証 API
```
POST   /api/auth/register     # ユーザー登録
POST   /api/auth/login         # ログイン
POST   /api/auth/logout        # ログアウト
POST   /api/auth/refresh       # トークンリフレッシュ
GET    /api/auth/me            # 現在のユーザー情報
POST   /api/auth/oauth/google  # Google OAuth
POST   /api/auth/oauth/github  # GitHub OAuth
```

### 3.2 セッション API
```
GET    /api/sessions           # セッション履歴取得
POST   /api/sessions           # 新規セッション開始
PUT    /api/sessions/:id       # セッション更新（一時停止/再開）
POST   /api/sessions/:id/complete  # セッション完了
DELETE /api/sessions/:id       # セッション削除
GET    /api/sessions/current   # 現在進行中のセッション
```

### 3.3 タグ API
```
GET    /api/tags               # タグ一覧
POST   /api/tags               # タグ作成
PUT    /api/tags/:id           # タグ更新
DELETE /api/tags/:id           # タグ削除
```

### 3.4 タスク API
```
GET    /api/tasks              # タスク一覧
POST   /api/tasks              # タスク作成
PUT    /api/tasks/:id          # タスク更新
DELETE /api/tasks/:id          # タスク削除
POST   /api/tasks/:id/complete # タスク完了
```

### 3.5 統計 API
```
GET    /api/stats/daily        # 日次統計
GET    /api/stats/weekly       # 週次統計
GET    /api/stats/monthly      # 月次統計
GET    /api/stats/summary      # サマリー統計
GET    /api/stats/tags         # タグ別統計
```

### 3.6 共有 API
```
POST   /api/share/session      # セッション共有開始
GET    /api/share/:code        # 共有セッション情報取得
DELETE /api/share/:code        # 共有停止
```

### 3.7 設定 API
```
GET    /api/preferences        # ユーザー設定取得
PUT    /api/preferences        # ユーザー設定更新
POST   /api/preferences/reset  # 設定リセット
```

### 3.8 WebSocket イベント
```
// クライアント → サーバー
session:start        # セッション開始
session:pause        # 一時停止
session:resume       # 再開
session:complete     # 完了
share:join           # 共有セッション参加
share:leave          # 共有セッション離脱

// サーバー → クライアント
session:tick         # タイマー更新（毎秒）
session:notification # 通知
share:participant    # 参加者情報更新
share:sync           # 同期ポモドーロ
```

## 4. ディレクトリ構造

```
pomodoro-timer/
├── apps/
│   ├── web/                      # Next.js PWA
│   │   ├── app/                  # App Router
│   │   │   ├── (auth)/          # 認証関連ページ
│   │   │   ├── (dashboard)/     # ダッシュボード
│   │   │   ├── api/             # API Routes (BFF)
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── timer/           # タイマーコンポーネント
│   │   │   ├── stats/           # 統計コンポーネント
│   │   │   └── ui/              # 共通UIコンポーネント
│   │   ├── hooks/               # カスタムフック
│   │   ├── lib/                 # ユーティリティ
│   │   ├── public/
│   │   └── styles/
│   │
│   └── api/                      # Express API Server
│       ├── src/
│       │   ├── controllers/     # コントローラー
│       │   ├── services/        # ビジネスロジック
│       │   ├── models/          # データモデル
│       │   ├── middlewares/     # ミドルウェア
│       │   ├── routes/          # ルーティング
│       │   ├── utils/           # ユーティリティ
│       │   ├── websocket/       # WebSocket ハンドラー
│       │   └── app.ts
│       └── tests/
│
├── packages/
│   ├── shared/                  # 共有型定義・ユーティリティ
│   │   ├── types/               # TypeScript型定義
│   │   ├── constants/           # 定数
│   │   └── utils/               # 共有ユーティリティ
│   │
│   └── database/                # データベース関連
│       ├── prisma/              # Prisma ORM
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── seeds/               # シードデータ
│
├── infrastructure/              # インフラ設定
│   ├── docker/                  # Docker設定
│   ├── k8s/                     # Kubernetes設定
│   └── terraform/               # Terraform設定
│
├── scripts/                     # ビルド・デプロイスクリプト
├── docs/                        # ドキュメント
│   ├── api/                     # API仕様書
│   └── architecture/            # アーキテクチャ図
│
├── .github/                     # GitHub Actions
├── docker-compose.yml
├── package.json                 # ルートpackage.json (Workspace)
├── turbo.json                   # Turborepo設定
└── README.md
```

## 5. 技術スタック

### 5.1 フロントエンド
- **フレームワーク**: Next.js 14 (App Router, Server Components)
- **言語**: TypeScript 5.x
- **UIライブラリ**: React 18.x
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query v5
- **スタイリング**: Tailwind CSS v3 + CSS Modules
- **UIコンポーネント**: shadcn/ui
- **フォーム**: React Hook Form + Zod
- **アニメーション**: Framer Motion
- **PWA**: Workbox + next-pwa
- **グラフ**: Recharts
- **日付処理**: date-fns
- **テスト**: Vitest + React Testing Library + Playwright

### 5.2 バックエンド
- **ランタイム**: Node.js 20 LTS
- **フレームワーク**: Express.js
- **言語**: TypeScript 5.x
- **ORM**: Prisma
- **認証**: Passport.js + JWT
- **バリデーション**: Zod
- **WebSocket**: Socket.io
- **ジョブキュー**: Bull
- **メール**: SendGrid / Resend
- **ファイルアップロード**: Multer + AWS S3
- **ロギング**: Winston
- **テスト**: Jest + Supertest

### 5.3 データベース
- **メインDB**: PostgreSQL 15
- **キャッシュ**: Redis 7
- **セッション**: Redis
- **フルテキスト検索**: PostgreSQL FTS (将来的にはMeilisearch)

### 5.4 インフラ・DevOps
- **コンテナ**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **ホスティング**:
  - Frontend: Vercel
  - Backend: AWS ECS / Railway / Render
  - Database: AWS RDS / Supabase
- **CDN**: Cloudflare
- **監視**: Sentry + DataDog / New Relic
- **APM**: OpenTelemetry
- **ログ管理**: AWS CloudWatch / LogDNA

### 5.5 開発ツール
- **パッケージマネージャー**: pnpm
- **モノレポ管理**: Turborepo
- **コード品質**: ESLint + Prettier + Husky
- **コミット規約**: Conventional Commits + Commitizen
- **API仕様**: OpenAPI 3.0 + Swagger
- **E2Eテスト**: Playwright
- **パフォーマンステスト**: Lighthouse CI

## 6. セキュリティ設計

### 6.1 認証・認可
- JWT (Access Token + Refresh Token)
- OAuth2 (Google, GitHub)
- Rate Limiting (express-rate-limit)
- CSRF Protection
- XSS Protection (Content Security Policy)

### 6.2 データ保護
- HTTPS通信の強制
- データベース暗号化 (at rest)
- パスワードハッシュ化 (bcrypt)
- 環境変数による機密情報管理
- SQL Injection対策 (Prepared Statements)

### 6.3 監査・ログ
- 全APIリクエストのロギング
- セキュリティイベントの記録
- 定期的なセキュリティ監査

## 7. パフォーマンス最適化

### 7.1 フロントエンド
- Code Splitting (動的インポート)
- Image Optimization (next/image)
- Bundle Size最適化
- Service Workerによるキャッシング
- React Server Components活用
- Lazy Loading
- Virtual Scrolling (大量データ表示時)

### 7.2 バックエンド
- データベースクエリ最適化 (インデックス、N+1問題対策)
- Redis キャッシング
- CDNによる静的アセット配信
- Gzip圧縮
- Connection Pooling
- 非同期処理 (Bull Queue)

### 7.3 監視・計測
- Core Web Vitals測定
- APMツールによるパフォーマンス監視
- エラー率・レスポンスタイム監視
- 負荷テストの定期実施

## 8. 将来の拡張性

### 8.1 機能拡張
- **AI連携**: 作業パターン分析、最適な休憩タイミング提案
- **チーム機能**: チームダッシュボード、共同ポモドーロセッション
- **インテグレーション**: Slack, Discord, Calendar連携
- **ゲーミフィケーション**: バッジ、ランキング、達成度システム
- **音声コントロール**: 音声コマンドでタイマー操作
- **ウィジェット**: デスクトップウィジェット、ブラウザ拡張機能

### 8.2 技術的拡張
- GraphQL APIの追加
- マイクロサービス化
- Kubernetesによるオーケストレーション
- Event-Driven Architecture
- マルチテナント対応
- 国際化 (i18n) 対応

## 9. デプロイメント戦略

### 9.1 環境構成
- **開発環境**: ローカルDocker環境
- **ステージング環境**: 本番同等構成
- **本番環境**: 高可用性構成 (マルチAZ)

### 9.2 デプロイプロセス
1. Feature Branch でに開発
2. Pull Request + コードレビュー
3. 自動テスト実行 (CI)
4. ステージング環境へデプロイ
5. E2Eテスト実行
6. 本番環境へデプロイ (Blue-Green or Canary)
7. ヘルスチェック
8. 監視・アラート

### 9.3 ロールバック戦略
- データベースマイグレーションの互換性維持
- Feature Flagによる段階的リリース
- 即座のロールバック手順の準備

## 10. 差別化ポイントの実装詳細

### 10.1 確実な通知システム
```typescript
// Service Worker での通知処理
class NotificationService {
  // 多重化された通知システム
  async notify(session: Session) {
    await Promise.allSettled([
      this.sendWebPush(),
      this.playSound(),
      this.updateTitle(),
      this.sendOSNotification(),
      this.vibrate()
    ]);
  }
}
```

### 10.2 タグ付き集中ログ
```typescript
// 集中セッションにタグを関連付け
interface FocusSession {
  id: string;
  tagId: string;
  startTime: Date;
  duration: number;
  productivity: number; // AI分析による生産性スコア
}
```

### 10.3 静かな共有機能
```typescript
// リアルタイム共有URL生成
class ShareService {
  generateShareLink(sessionId: string): string {
    // 一時的な読み取り専用リンクを生成
    return `${BASE_URL}/share/${generateShareCode()}`;
  }
}
```

## まとめ

本設計は、競合分析で特定した市場ギャップを埋めることを目的としています。特に「Webでも信頼できる集中体験」と「軽量かつ拡張可能な設計」を重視し、リモートワーカーや個人の生産性向上ニーズに応える、差別化されたポモドーロタイマーアプリケーションを実現します。

PWA技術による堅牢な通知システム、タグ付き集中ログによる振り返り機能、ミニマルなUIと段階的な機能拡張により、シンプルさと高機能性のバランスを実現し、長期的な価値を提供します。