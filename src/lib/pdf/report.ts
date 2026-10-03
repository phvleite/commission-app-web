import PDFDocument from 'pdfkit'

export interface PdfReportOptions {
    title: string
    companyName: string
    website: string
    subtitle?: string
    compress?: boolean
}

export interface PdfReportColumn {
    label: string
    width: number
    align?: 'left' | 'center' | 'right'
}

interface PdfReportTableOptions {
    rowStyles?: (rowIndex: number) => {
        backgroundColor?: string
        border?: { top?: number; right?: number; bottom?: number; left?: number }
        borderColor?: { top?: string; right?: string; bottom?: string; left?: string }
    }
}

const COLORS = {
    text: '#1b1f23',
    primary: '#0f2c4d',
    muted: '#495057',
    border: '#d3dce8',
    header: '#f3f6fa',
    alternate: '#f5f9ff',
}

export function drawReportTable(
    doc: PDFKit.PDFDocument,
    columns: PdfReportColumn[],
    rows: string[][],
    options: PdfReportTableOptions = {},
): void {
    const originalTop = doc.page.margins.top
    const tableHeaderHeight = 30

    function drawHeader(position: number) {
        doc.table({
            position: { x: doc.page.margins.left, y: position },
            columnStyles: columns.map((column) => ({
                width: column.width,
                align: { x: column.align ?? 'left', y: 'center' },
            })),
            defaultStyle: {
                padding: 6,
                border: 0.5,
                borderColor: COLORS.border,
                backgroundColor: COLORS.header,
                textColor: COLORS.primary,
            },
            rowStyles: { height: tableHeaderHeight },
            data: [
                columns.map((column) => ({
                    text: column.label,
                    font: { src: 'Helvetica-Bold', size: 9 },
                    type: 'TH' as const,
                })),
            ],
        })
    }

    if (doc.y + tableHeaderHeight + 24 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage()
    }
    drawHeader(doc.y)
    doc.page.margins.top = originalTop + tableHeaderHeight

    function repeatHeader() {
        const savedY = doc.y
        drawHeader(originalTop)
        doc.y = savedY
    }

    doc.on('pageAdded', repeatHeader)
    try {
        doc.font('Helvetica').fontSize(9)
        doc.table({
            position: { x: doc.page.margins.left, y: doc.y },
            columnStyles: columns.map((column) => ({
                width: column.width,
                align: { x: column.align ?? 'left', y: 'top' },
            })),
            defaultStyle: {
                padding: 6,
                border: 0.5,
                borderColor: COLORS.border,
                textColor: COLORS.text,
            },
            rowStyles:
                options.rowStyles ??
                ((index) => ({
                    backgroundColor: index % 2 === 0 ? COLORS.alternate : '#ffffff',
                })),
            data: rows.map((row) =>
                row.map((text) => ({ text, font: { src: 'Helvetica', size: 9 } })),
            ),
        })
    } finally {
        doc.removeListener('pageAdded', repeatHeader)
        doc.page.margins.top = originalTop
    }
    doc.x = doc.page.margins.left
    doc.moveDown()
}

export function createPdfReport(
    options: PdfReportOptions,
    render: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 36, right: 36, bottom: 88, left: 36 },
            bufferPages: true,
            compress: options.compress ?? true,
            info: { Title: options.title, Author: options.companyName, Creator: 'Commission' },
        })
        const chunks: Buffer[] = []
        doc.on('data', (chunk: Buffer) => chunks.push(chunk))
        doc.on('error', reject)
        doc.on('end', () => resolve(Buffer.concat(chunks)))

        try {
            const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
            const titleHeight = doc
                .font('Helvetica-Bold')
                .fontSize(18)
                .heightOfString(options.title, { width: contentWidth })
            const subtitleHeight = options.subtitle
                ? doc
                      .font('Helvetica')
                      .fontSize(9)
                      .heightOfString(options.subtitle, { width: contentWidth }) + 8
                : 0
            doc.page.margins.top = 36 + titleHeight + subtitleHeight + 20
            doc.options.margins = doc.page.margins

            function drawHeading() {
                const savedX = doc.x
                const savedY = doc.y
                doc.font('Helvetica-Bold')
                    .fontSize(18)
                    .fillColor(COLORS.primary)
                    .text(options.title, 36, 36, { width: contentWidth })
                if (options.subtitle) {
                    doc.font('Helvetica')
                        .fontSize(9)
                        .fillColor(COLORS.muted)
                        .text(options.subtitle, 36, 36 + titleHeight + 8, { width: contentWidth })
                }
                const lineY = 36 + titleHeight + subtitleHeight + 8
                doc.moveTo(36, lineY)
                    .lineTo(36 + contentWidth, lineY)
                    .lineWidth(1)
                    .strokeColor(COLORS.primary)
                    .stroke()
                doc.font('Helvetica').fontSize(10).fillColor(COLORS.text)
                doc.x = savedX
                doc.y = savedY
            }

            drawHeading()
            doc.on('pageAdded', drawHeading)
            doc.x = doc.page.margins.left
            doc.y = doc.page.margins.top
            render(doc)
            doc.removeListener('pageAdded', drawHeading)

            const pages = doc.bufferedPageRange()
            for (let index = pages.start; index < pages.start + pages.count; index += 1) {
                doc.switchToPage(index)
                const bottomMargin = doc.page.margins.bottom
                doc.page.margins.bottom = 0
                const footerY = doc.page.height - 66
                doc.moveTo(36, footerY - 8)
                    .lineTo(36 + contentWidth, footerY - 8)
                    .lineWidth(0.5)
                    .strokeColor(COLORS.border)
                    .stroke()
                doc.font('Helvetica')
                    .fontSize(8)
                    .fillColor(COLORS.muted)
                    .text(
                        `${options.companyName} | ${options.website} | contato@commission.com.br`,
                        36,
                        footerY,
                        { width: contentWidth, align: 'center' },
                    )
                doc.text(
                    `Página ${index - pages.start + 1} de ${pages.count}`,
                    36,
                    doc.page.height - 24,
                    { width: contentWidth, align: 'center' },
                )
                doc.page.margins.bottom = bottomMargin
            }
            doc.end()
        } catch (error) {
            doc.destroy()
            reject(error)
        }
    })
}
