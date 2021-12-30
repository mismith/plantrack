function writeToString(rows: any[][]) {
  return rows.map(row => `"${row.join('","')}"`).join('\n')
}

export async function downloadCSVRowsAsFile(csvRows: any[][]) {
  const csvString = await writeToString(csvRows)

  const a = document.createElement('a')
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  a.href = url
  a.setAttribute('download', 'export.csv')
  a.click()
}