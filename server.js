import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.local 로드
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const ADMIN_EMAIL = process.env.GMAIL_USER || 'skyjamin4279@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

// public/uploads 폴더 생성 (Vercel 정적 서빙 및 로컬 개발용)
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 메타데이터 파일
const metaPath = path.join(__dirname, 'uploads', 'meta.json');

function readMeta() {
  try {
    if (fs.existsSync(metaPath)) {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (e) {
    console.error('메타데이터 읽기 오류:', e);
  }
  return {};
}

function writeMeta(meta) {
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
}

// multer 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const { itemId, draftId, imageIndex } = req.body;
    const ext = path.extname(file.originalname);
    const idx = imageIndex === '1' ? 1 : 0;
    const filename = `${itemId}_${draftId}_img${idx}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// 정적 파일 서빙
app.use('/uploads', express.static(uploadsDir));

// 이미지 목록
app.get('/api/images', (req, res) => {
  const meta = readMeta();
  res.json(meta);
});

// 이미지 업로드
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    const { itemId, draftId, imageIndex } = req.body;
    if (!req.file || !itemId || !draftId) {
      return res.status(400).json({ error: '필수 파라미터 누락' });
    }

    const idx = imageIndex === '1' ? 1 : 0;
    const imageUrl = `/uploads/${req.file.filename}`;

    const meta = readMeta();
    if (!meta[itemId]) meta[itemId] = {};
    if (!Array.isArray(meta[itemId][draftId])) {
      meta[itemId][draftId] = [null, null];
    }
    const oldUrl = meta[itemId][draftId][idx];
    if (oldUrl) {
      const oldPath = path.join(__dirname, oldUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    meta[itemId][draftId][idx] = imageUrl;
    writeMeta(meta);

    io.emit('imageUpdated', { itemId, draftId, imageUrls: meta[itemId][draftId] });
    res.json({ success: true, imageUrl });
  } catch (e) {
    console.error('업로드 오류:', e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// 이미지 삭제
app.delete('/api/images/:itemId/:draftId/:imageIndex', (req, res) => {
  try {
    const { itemId, draftId, imageIndex } = req.params;
    const idx = Number(imageIndex);
    const meta = readMeta();
    if (meta[itemId]?.[draftId]) {
      const urls = meta[itemId][draftId];
      if (Array.isArray(urls) && urls[idx]) {
        const filePath = path.join(__dirname, urls[idx]);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        urls[idx] = null;
        writeMeta(meta);
        io.emit('imageUpdated', { itemId, draftId, imageUrls: urls });
      }
    }
    res.json({ success: true });
  } catch (e) {
    console.error('삭제 오류:', e);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ─── 견적 이메일 발송 ───────────────────────────────────────────────────────
app.post('/api/send-estimate', async (req, res) => {
  const { senderName, senderPhone, senderEmail, memo, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: '장바구니가 비어있습니다.' });
  }
  if (!senderName || !senderPhone) {
    return res.status(400).json({ error: '이름과 연락처를 입력해주세요.' });
  }

  // 매 요청마다 .env.local에서 직접 읽기 (서버 재시작 없이도 반영)
  const freshEnv = {};
  try {
    const envLines = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8').split('\n');
    for (const line of envLines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      freshEnv[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
  } catch { }

  const gmailUser = freshEnv.GMAIL_USER || ADMIN_EMAIL;
  const gmailPass = freshEnv.GMAIL_APP_PASSWORD || '';

  console.log('[이메일 발송] 사용자:', gmailUser, '/ 비밀번호 길이:', gmailPass.replace(/\s/g, '').length);

  if (!gmailPass || gmailPass === '여기에_앱비밀번호_입력') {
    return res.status(500).json({ error: '이메일 발송 설정이 완료되지 않았습니다. .env.local의 GMAIL_APP_PASSWORD를 설정해주세요.' });
  }

  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  // HTML 이메일 본문
  const itemRows = items
    .map((item, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fafaf9' : '#ffffff'}">
        <td style="padding:10px 14px;font-weight:700;color:#1c1917">${item.name}</td>
        <td style="padding:10px 14px;color:#5B3E31;font-weight:600">${item.draftLabel}</td>
        <td style="padding:10px 14px;color:#57534e">${item.paper}</td>
        <td style="padding:10px 14px;color:#57534e">${item.size}</td>
        <td style="padding:10px 14px;text-align:center;font-weight:700;color:#1c1917">${item.quantity}개</td>
        <td style="padding:10px 14px;text-align:center;color:#92400e;font-weight:600">${Array.isArray(item.options) && item.options.length > 0 ? item.options.join(', ') : '-'}</td>
      </tr>`)
    .join('');

  const htmlBody = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Apple SD Gothic Neo',Arial,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    
    <!-- Header -->
    <div style="background:#5B3E31;padding:32px 36px">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">같이n가치</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:0.1em;text-transform:uppercase">새로운 견적 문의가 도착했습니다</p>
    </div>

    <div style="padding:32px 36px">
      <!-- 발신자 정보 -->
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 14px;font-size:11px;font-weight:800;color:#a8a29e;text-transform:uppercase;letter-spacing:0.1em">문의자 정보</p>
        <table style="border-collapse:collapse;width:100%">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#78716c;width:80px">이름</td>
            <td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#78716c">연락처</td>
            <td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderPhone}</td>
          </tr>
          ${senderEmail ? `<tr>
            <td style="padding:4px 0;font-size:13px;color:#78716c">이메일</td>
            <td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderEmail}</td>
          </tr>` : ''}
          ${memo ? `<tr>
            <td style="padding:4px 0;font-size:13px;color:#78716c;vertical-align:top">메모</td>
            <td style="padding:4px 0;font-size:13px;color:#1c1917">${memo}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- 견적 항목 -->
      <p style="margin:0 0 12px;font-size:11px;font-weight:800;color:#a8a29e;text-transform:uppercase;letter-spacing:0.1em">견적 항목</p>
      <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4">
        <thead>
          <tr style="background:#5B3E31">
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">품목</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">시안</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">용지</th>
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">크기</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">수량</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:rgba(255,255,255,0.8);font-weight:700;letter-spacing:0.05em">옵션</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="background:#fafaf9;border-top:2px solid #e7e5e4">
            <td colspan="5" style="padding:12px 14px;font-size:12px;font-weight:700;color:#78716c;text-align:right">총 수량 (${items.length}종)</td>
            <td style="padding:12px 14px;text-align:center;font-size:16px;font-weight:800;color:#5B3E31">${totalQty}개</td>
          </tr>
        </tfoot>
      </table>

      <!-- 문의 시각 -->
      <p style="margin:20px 0 0;font-size:11px;color:#a8a29e;text-align:right">문의 일시: ${now}</p>
    </div>

    <!-- Footer -->
    <div style="background:#fafaf9;border-top:1px solid #e7e5e4;padding:20px 36px;text-align:center">
      <p style="margin:0;font-size:11px;color:#a8a29e">같이n가치 디자인 카탈로그 시스템에서 자동 발송된 메일입니다.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"같이n가치 카탈로그" <${gmailUser}>`,
      to: ADMIN_EMAIL,
      replyTo: senderEmail || undefined,
      subject: `[같이n가치] 견적 문의 - ${senderName} (${senderPhone})`,
      html: htmlBody,
    });

    console.log(`견적 이메일 발송 완료: ${senderName} / ${now}`);
    res.json({ success: true });
  } catch (e) {
    console.error('이메일 발송 오류:', e);
    res.status(500).json({ error: `이메일 발송 실패: ${e.message}` });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`클라이언트 연결: ${socket.id}`);
  socket.on('disconnect', () => console.log(`연결 해제: ${socket.id}`));
});

const PORT = 4000;
httpServer.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
