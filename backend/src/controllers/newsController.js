function success(res, message, data = null, status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message, error = null, status = 500) {
  return res.status(status).json({ success: false, message, error });
}

/* =========================
  오늘의 주식 한 줄 뉴스 조회 (구글 실시간 뉴스 API 연동)
========================= */
exports.getTodayStockNews = async (req, res) => {
  try {
    const rssUrl = "https://news.google.com/rss/search?q=%EC%A3%BC%EC%8B%9D+%EC%A6%9D%EC%8B%9C&hl=ko&gl=KR&ceid=KR:ko";
    
    const response = await fetch(rssUrl);
    const xml = await response.text();

    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let idCounter = 1;

    // 🟢 핵심 수정: match을 사용하여 태그 안의 알맹이 텍스트를 정확히 추출합니다.
    while ((match = itemRegex.exec(xml)) !== null && items.length < 15) {
      const itemContent = match[1]; // 여기서을 붙여야 배열이 아닌 '글자'가 됩니다!
      
        const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
        const sourceMatch = itemContent.match(/<source.*?>(.*?)<\/source>/);

        if (titleMatch && linkMatch) {
        let title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim();
        let url = linkMatch[1].trim();
        let source = sourceMatch ? sourceMatch[1].trim() : "구글 뉴스";

        if (title.includes(` - ${source}`)) {
            title = title.replace(` - ${source}`, "");
        }

        items.push({ id: idCounter++, source, title, url });
        }
    }

    return success(res, "실시간 뉴스 조회 성공", items);
  } catch (err) {
    console.error("getTodayStockNews error =", err);
    return fail(res, "뉴스 조회 실패", err.message);
  }
};