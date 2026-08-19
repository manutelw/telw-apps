export async function onRequest(context) {
  const response = await context.next();
  if (!response.ok) return response;

  let html = await response.text();

  const oldBlock = `        XLSX.writeFile(
          workbook,
          \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`,
          {cellStyles:true,cellDates:true}
        );`;

  const newBlock = `        const fileName = \`ASCENT_\${institutionName}_Trainer_Report_\${new Date().toISOString().slice(0,10)}.xlsx\`;
        const workbookBytes = XLSX.write(workbook,{
          bookType:"xlsx",
          type:"array",
          cellStyles:true,
          cellDates:true
        });
        const workbookBlob = new Blob(
          [workbookBytes],
          {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        );
        const downloadUrl = URL.createObjectURL(workbookBlob);
        const downloadLink = document.createElement("a");
        downloadLink.href = downloadUrl;
        downloadLink.download = fileName;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl),30000);`;

  if (html.includes(oldBlock)) {
    html = html.replace(oldBlock, newBlock);
  }

  html = html.replace(
    'data-ascent-build="2026-08-04.5"',
    'data-ascent-build="2026-08-19.3"'
  );

  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "no-store, max-age=0");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
