// PDF导出工具

/**
 * 导出体测报告为PDF
 */
export async function exportPhysicalTestReportPDF(reportData: any): Promise<void> {
  // 生成HTML模板
  const html = generatePhysicalTestReportHTML(reportData);

  // 创建iframe打印
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) return;

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // 等待内容加载后打印
  iframe.onload = () => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 100);
  };
}

function generatePhysicalTestReportHTML(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>青少年体能评估报告 - ${data.playerName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1a1a1a; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .header h1 { font-size: 24px; color: #10b981; margin-bottom: 10px; }
    .header .subtitle { color: #666; font-size: 14px; }
    .player-info { background: #f0fdf9; padding: 20px; border-radius: 12px; margin-bottom: 30px; }
    .player-info h2 { color: #10b981; margin-bottom: 10px; }
    .player-info .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .info-item { text-align: center; }
    .info-item .label { color: #666; font-size: 12px; }
    .info-item .value { font-size: 18px; font-weight: bold; color: #1a1a1a; }
    .section { margin-bottom: 30px; }
    .section h3 { color: #10b981; font-size: 16px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
    .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
    .data-card { background: #f9fafb; padding: 15px; border-radius: 8px; }
    .data-card .label { color: #666; font-size: 12px; margin-bottom: 5px; }
    .data-card .value { font-size: 20px; font-weight: bold; }
    .data-card .unit { color: #666; font-size: 12px; font-weight: normal; }
    .data-card .percentile { font-size: 12px; margin-top: 5px; }
    .strengths { background: #f0fdf9; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
    .strengths h4 { color: #10b981; margin-bottom: 8px; }
    .strengths ul { padding-left: 20px; }
    .suggestions li { margin-bottom: 8px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>青少年体能评估报告</h1>
      <p class="subtitle">少年球探 × ${data.clubName || '青少年足球平台'}</p>
    </div>

    <div class="player-info">
      <h2>基本信息</h2>
      <div class="info-grid">
        <div class="info-item">
          <div class="label">姓名</div>
          <div class="value">${data.playerName}</div>
        </div>
        <div class="info-item">
          <div class="label">年龄</div>
          <div class="value">${data.age}岁</div>
        </div>
        <div class="info-item">
          <div class="label">位置</div>
          <div class="value">${data.position}</div>
        </div>
        <div class="info-item">
          <div class="label">体测日期</div>
          <div class="value">${data.testDate}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>体测数据</h3>
      <div class="data-grid">
        ${(data.testData || []).map((item: any) => `
          <div class="data-card">
            <div class="label">${item.name}</div>
            <div class="value">${item.value}${item.unit || ''}</div>
            <div class="percentile">前${item.percentile}% | ${item.rating}</div>
          </div>
        `).join('')}
      </div>
    </div>

    ${data.strengths?.length ? `
    <div class="section">
      <h3>优势与待提升</h3>
      <div class="strengths">
        <h4>优势项目</h4>
        <ul>
          ${data.strengths.map((s: string) => `<li>${s}</li>`).join('')}
        </ul>
      </div>
    </div>
    ` : ''}

    ${data.suggestions?.length ? `
    <div class="section">
      <h3>训练建议</h3>
      <ul class="suggestions">
        ${data.suggestions.map((s: string) => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="footer">
      <p>报告生成时间：${new Date().toLocaleString('zh-CN')}</p>
      <p>少年球探 - 青少年足球服务平台</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * 下载文件
 */
export function downloadFile(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
