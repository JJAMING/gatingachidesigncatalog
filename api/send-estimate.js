import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { senderName, senderPhone, senderEmail, memo, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: '장바구니가 비어있습니다.' });
    }
    if (!senderName || !senderPhone) {
        return res.status(400).json({ error: '이름과 연락처를 입력해주세요.' });
    }

    // Vercel 환경 변수 사용
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.GMAIL_USER || 'skyjamin4279@gmail.com';

    if (!gmailPass) {
        return res.status(500).json({ error: '이메일 발송 설정(GMAIL_APP_PASSWORD)이 완료되지 않았습니다.' });
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
    <div style="background:#5B3E31;padding:32px 36px">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">같이n가치</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:12px;letter-spacing:0.1em;text-transform:uppercase">새로운 견적 문의가 도착했습니다</p>
    </div>
    <div style="padding:32px 36px">
      <div style="background:#fafaf9;border:1px solid #e7e5e4;border-radius:12px;padding:20px 24px;margin-bottom:24px">
        <p style="margin:0 0 14px;font-size:11px;font-weight:800;color:#a8a29e;text-transform:uppercase;letter-spacing:0.1em">문의자 정보</p>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:4px 0;font-size:13px;color:#78716c;width:80px">이름</td><td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderName}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#78716c">연락처</td><td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderPhone}</td></tr>
          ${senderEmail ? `<tr><td style="padding:4px 0;font-size:13px;color:#78716c">이메일</td><td style="padding:4px 0;font-size:13px;font-weight:700;color:#1c1917">${senderEmail}</td></tr>` : ''}
          ${memo ? `<tr><td style="padding:4px 0;font-size:13px;color:#78716c;vertical-align:top">메모</td><td style="padding:4px 0;font-size:13px;color:#1c1917">${memo}</td></tr>` : ''}
        </table>
      </div>
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
      <p style="margin:20px 0 0;font-size:11px;color:#a8a29e;text-align:right">문의 일시: ${now}</p>
    </div>
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
            to: adminEmail,
            replyTo: senderEmail || undefined,
            subject: `[같이n가치] 견적 문의 - ${senderName} (${senderPhone})`,
            html: htmlBody,
        });

        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('이메일 발송 오류:', e);
        return res.status(500).json({ error: `이메일 발송 실패: ${e.message}` });
    }
}
