import React, { useEffect, useRef } from 'react';
import { TimelineEntry } from '../types';

interface DailyLogSheetProps {
    date: string;
    dateISO: string;
    timeline: TimelineEntry[];
    totalMiles: number;
    dayMiles: number;
    carrier?: string;
    truckNumber?: string;
    fromLocation?: string;
    toLocation?: string;
    sheetNumber: number;
    totalSheets: number;
}

const getRowIndex = (status: string): number => {
    if (status.includes('Driving')) return 2;
    if (status.includes('Sleeper')) return 1;
    if (status.includes('Pickup') || status.includes('Drop-off') || status.includes('Fueling') || status.includes('On-Duty')) return 3;
    return 0;
};

const ROW_LABELS = [
    ['1. Off Duty'],
    ['2. Sleeper', 'Berth'],
    ['3. Driving'],
    ['4. On Duty', '(not driving)'],
];

const ROW_FILL_COLORS = ['#f0fdf4', '#eff6ff', '#fefce8', '#fff7ed'];
const ROW_LINE_COLORS = ['#15803d', '#1d4ed8', '#ca8a04', '#c2410c'];

const DailyLogSheet: React.FC<DailyLogSheetProps> = ({
    date,
    dateISO,
    timeline,
    totalMiles,
    dayMiles,
    carrier = 'Spotter Logistics Inc.',
    truckNumber = 'TRK-2026-001',
    fromLocation = '',
    toLocation = '',
    sheetNumber,
    totalSheets,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        ctx.clearRect(0, 0, W, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, canvas.height);

        const PAD = 30;
        let curY = PAD;

        const hline = (x1: number, y: number, x2: number, color = '#bbb', w = 0.7) => {
            ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
            ctx.restore();
        };

        const vline = (x: number, y1: number, y2: number, color = '#bbb', w = 0.7) => {
            ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w;
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
            ctx.restore();
        };

        const box = (x: number, y: number, w: number, h: number, fill?: string, stroke?: string, sw = 0.7) => {
            ctx.save();
            if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
            if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeRect(x, y, w, h); }
            ctx.restore();
        };

        const txt = (
            t: string, x: number, y: number,
            opts: { sz?: number; bold?: boolean; color?: string; align?: CanvasTextAlign; italic?: boolean } = {}
        ) => {
            const { sz = 10, bold = false, color = '#111', align = 'left', italic = false } = opts;
            ctx.save();
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${sz}px Arial, sans-serif`;
            ctx.fillText(t, x, y);
            ctx.restore();
        };

        txt("Driver's Daily Log", PAD, curY + 15, { sz: 17, bold: true });
        txt('(24 hours)', PAD, curY + 27, { sz: 8, color: '#666' });

        const dateObj = new Date(dateISO + 'T12:00:00');
        const dbY = curY + 3;
        const dbH = 20;
        const dbMidX = W / 2 - 20;

        box(dbMidX - 55, dbY, 38, dbH, '#f8fafc', '#999');
        txt(String(dateObj.getMonth() + 1), dbMidX - 55 + 19, dbY + 14, { sz: 11, align: 'center', bold: true });
        txt('(month)', dbMidX - 55 + 19, dbY + dbH + 9, { sz: 7, color: '#888', align: 'center' });

        box(dbMidX - 11, dbY, 30, dbH, '#f8fafc', '#999');
        txt(String(dateObj.getDate()), dbMidX - 11 + 15, dbY + 14, { sz: 11, align: 'center', bold: true });
        txt('(day)', dbMidX - 11 + 15, dbY + dbH + 9, { sz: 7, color: '#888', align: 'center' });

        box(dbMidX + 25, dbY, 42, dbH, '#f8fafc', '#999');
        txt(String(dateObj.getFullYear()), dbMidX + 25 + 21, dbY + 14, { sz: 11, align: 'center', bold: true });
        txt('(year)', dbMidX + 25 + 21, dbY + dbH + 9, { sz: 7, color: '#888', align: 'center' });

        txt('Original - File at home terminal.', W - PAD, curY + 10, { sz: 7, color: '#555', align: 'right' });
        txt('Duplicate - Driver retains in his/her possession for 8 days.', W - PAD, curY + 20, { sz: 7, color: '#555', align: 'right' });
        txt(`Sheet ${sheetNumber} of ${totalSheets}`, W - PAD, curY + 32, { sz: 8.5, bold: true, color: '#333', align: 'right' });

        curY += 50;

        txt('From:', PAD, curY + 11, { sz: 9, bold: true });
        hline(PAD + 32, curY + 12, W / 2 - 8, '#999');
        txt(fromLocation, PAD + 36, curY + 11, { sz: 9, color: '#222' });

        txt('To:', W / 2 + 4, curY + 11, { sz: 9, bold: true });
        hline(W / 2 + 22, curY + 12, W - PAD, '#999');
        txt(toLocation, W / 2 + 26, curY + 11, { sz: 9, color: '#222' });

        curY += 22;

        const BH = 30;
        const leftW = (W / 2) - PAD - 8;
        const rightX = W / 2 + 4;
        const rightW = W - rightX - PAD;
        const mBox1W = Math.floor(leftW * 0.42);
        const mBox2W = Math.floor(leftW * 0.42);

        box(PAD, curY, mBox1W, BH, '#f8fafc', '#aaa');
        txt(String(Math.round(dayMiles)), PAD + mBox1W / 2, curY + 18, { sz: 13, bold: true, align: 'center', color: '#00414B' });
        txt('Total Miles Driving Today', PAD + mBox1W / 2, curY + BH + 10, { sz: 7, color: '#666', align: 'center' });

        box(PAD + mBox1W + 6, curY, mBox2W, BH, '#f8fafc', '#aaa');
        txt(String(Math.round(totalMiles)), PAD + mBox1W + 6 + mBox2W / 2, curY + 18, { sz: 13, bold: true, align: 'center', color: '#00414B' });
        txt('Total Mileage Today', PAD + mBox1W + 6 + mBox2W / 2, curY + BH + 10, { sz: 7, color: '#666', align: 'center' });

        const truckBoxW = mBox1W + 6 + mBox2W;
        box(PAD, curY + BH + 18, truckBoxW, 24, '#f8fafc', '#aaa');
        txt('Truck/Tractor & Trailer Numbers or License Plate(s)/State', PAD + 4, curY + BH + 27, { sz: 7, color: '#777' });
        txt(truckNumber, PAD + truckBoxW / 2, curY + BH + 38, { sz: 9, bold: true, align: 'center' });

        const rightFields = [
            { label: 'Name of Carrier or Carriers', value: carrier },
            { label: 'Main Office Address', value: '123 Logistics Blvd, Chicago, IL 60601' },
            { label: 'Home Terminal Address', value: '456 Depot St, Chicago, IL 60602' },
        ];
        let rfY = curY;
        rightFields.forEach(f => {
            box(rightX, rfY, rightW, 24, '#f8fafc', '#aaa');
            txt(f.label, rightX + 4, rfY + 9, { sz: 7, color: '#888' });
            txt(f.value, rightX + 4, rfY + 20, { sz: 8.5, bold: true });
            rfY += 28;
        });

        curY += BH + 18 + 24 + 18;

        const GRID_LEFT = 120;
        const TOTAL_COL_W = 58;
        const GRID_RIGHT = W - PAD - TOTAL_COL_W - 4;
        const GRID_W = GRID_RIGHT - GRID_LEFT;
        const ROW_H = 32;
        const GRID_TOP = curY + 24;
        const GRID_H = ROW_H * 4;

        txt('Mid-', GRID_LEFT, curY + 9, { sz: 7, color: '#444', align: 'center' });
        txt('night', GRID_LEFT, curY + 17, { sz: 7, color: '#444', align: 'center' });

        for (let h = 1; h <= 23; h++) {
            const x = GRID_LEFT + (h / 24) * GRID_W;
            const label = h === 12 ? 'Noon' : String(h <= 12 ? h : h - 12);
            txt(label, x, curY + 14, { sz: h === 12 ? 8.5 : 7, bold: h === 12, color: h === 12 ? '#111' : '#555', align: 'center' });
        }

        txt('Mid-', GRID_RIGHT, curY + 9, { sz: 7, color: '#444', align: 'center' });
        txt('night', GRID_RIGHT, curY + 17, { sz: 7, color: '#444', align: 'center' });
        txt('Total', GRID_RIGHT + TOTAL_COL_W / 2 + 4, curY + 9, { sz: 7.5, color: '#333', align: 'center' });
        txt('Hours', GRID_RIGHT + TOTAL_COL_W / 2 + 4, curY + 18, { sz: 7.5, color: '#333', align: 'center' });

        ROW_LABELS.forEach((labelLines, i) => {
            const rowY = GRID_TOP + i * ROW_H;
            box(GRID_LEFT, rowY, GRID_W, ROW_H, ROW_FILL_COLORS[i]);
            box(GRID_LEFT, rowY, GRID_W, ROW_H, undefined, '#bbb', 0.6);
            labelLines.forEach((l, li) => {
                txt(l, GRID_LEFT - 5, rowY + 12 + li * 11, { sz: 8, color: '#222', align: 'right' });
            });
        });

        for (let h = 0; h <= 24; h++) {
            const x = GRID_LEFT + (h / 24) * GRID_W;
            const isMajor = h % 6 === 0;
            vline(x, GRID_TOP, GRID_TOP + GRID_H, isMajor ? '#888' : '#d1d5db', isMajor ? 1 : 0.5);
            if (h < 24) {
                for (let q = 1; q <= 3; q++) {
                    const qx = GRID_LEFT + ((h + q / 4) / 24) * GRID_W;
                    const tickLen = q === 2 ? 7 : 4;
                    for (let r = 0; r < 4; r++) {
                        const ry = GRID_TOP + r * ROW_H;
                        vline(qx, ry, ry + tickLen, '#bbb', 0.5);
                        vline(qx, ry + ROW_H - tickLen, ry + ROW_H, '#bbb', 0.5);
                    }
                }
            }
        }

        const dayStart = new Date(dateISO + 'T00:00:00');
        const dayEnd = new Date(dateISO + 'T24:00:00');
        const rowHours = [0, 0, 0, 0];

        const segments: { x1: number; x2: number; rowIdx: number; rowCenterY: number }[] = [];

        timeline.forEach(entry => {
            const eStart = new Date(entry.start);
            const eEnd = new Date(entry.end);
            if (eStart >= dayEnd || eEnd <= dayStart) return;

            const cs = eStart < dayStart ? dayStart : eStart;
            const ce = eEnd > dayEnd ? dayEnd : eEnd;
            const sf = (cs.getTime() - dayStart.getTime()) / (24 * 3600 * 1000);
            const ef = (ce.getTime() - dayStart.getTime()) / (24 * 3600 * 1000);
            const rowIdx = getRowIndex(entry.status);

            rowHours[rowIdx] += (ce.getTime() - cs.getTime()) / 3600000;
            segments.push({
                x1: GRID_LEFT + sf * GRID_W,
                x2: GRID_LEFT + ef * GRID_W,
                rowIdx,
                rowCenterY: GRID_TOP + rowIdx * ROW_H + ROW_H / 2,
            });
        });

        ctx.save();
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'miter';
        ctx.lineCap = 'square';

        segments.forEach((seg, i) => {
            ctx.strokeStyle = ROW_LINE_COLORS[seg.rowIdx];
            if (i > 0) {
                const prev = segments[i - 1];
                ctx.beginPath();
                ctx.moveTo(prev.x2, prev.rowCenterY);
                ctx.lineTo(seg.x1, seg.rowCenterY);
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.rowCenterY);
            ctx.lineTo(seg.x2, seg.rowCenterY);
            ctx.stroke();
        });

        ctx.restore();

        rowHours.forEach((hrs, i) => {
            const rowY = GRID_TOP + i * ROW_H;
            box(GRID_RIGHT + 4, rowY, TOTAL_COL_W - 4, ROW_H, '#f8fafc', '#bbb', 0.6);
            txt(hrs.toFixed(2), GRID_RIGHT + 4 + (TOTAL_COL_W - 4) / 2, rowY + ROW_H / 2 + 4, {
                sz: 9.5, bold: true, align: 'center', color: hrs > 0 ? '#00414B' : '#aaa',
            });
        });

        curY = GRID_TOP + GRID_H + 18;

        txt('Remarks', PAD, curY + 11, { sz: 9.5, bold: true });
        curY += 16;
        box(PAD, curY, W - PAD * 2, 56, '#fafafa', '#bbb');

        const stops = timeline.filter(e => {
            const s = new Date(e.start);
            const en = new Date(e.end);
            return s < dayEnd && en > dayStart && (
                e.status.includes('Rest') || e.status.includes('Break') ||
                e.status.includes('Fueling') || e.status.includes('Pickup') ||
                e.status.includes('Drop-off') || e.status.includes('Restart')
            );
        });

        let rmkX = PAD + 6;
        let rmkY = curY + 13;
        const rmkColW = (W - PAD * 2) / 2;
        stops.slice(0, 6).forEach((s, si) => {
            if (si === 3) { rmkX = PAD + 6 + rmkColW; rmkY = curY + 13; }
            const t = new Date(s.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            txt(`${t} – ${s.status} (${Math.round(s.duration_minutes)} min)`, rmkX, rmkY, { sz: 8, color: '#333' });
            rmkY += 13;
        });

        curY += 66;

        txt('Shipping Documents:', PAD, curY + 11, { sz: 9, bold: true });
        hline(PAD + 120, curY + 12, W / 2 + 60, '#bbb');
        curY += 18;

        txt('DVL or Manifest No.', PAD, curY + 10, { sz: 8 });
        hline(PAD + 110, curY + 11, W / 2, '#bbb');
        txt('or', PAD, curY + 22, { sz: 8 });
        hline(PAD + 18, curY + 23, W / 2, '#bbb');
        curY += 30;

        txt('Shipper & Commodity', PAD, curY + 10, { sz: 8 });
        hline(PAD + 120, curY + 11, W - PAD, '#bbb');
        curY += 20;

        txt('Enter name of place you reported and where released from work and when and where each change of duty occurred.', W / 2, curY + 10, { sz: 7.5, color: '#555', align: 'center' });
        txt('Use time standard of home terminal.', W / 2, curY + 21, { sz: 7.5, color: '#555', align: 'center' });
        curY += 32;

        const recapH = 90;
        box(PAD, curY, W - PAD * 2, recapH, '#f8fafc', '#bbb');

        txt('Recap:', PAD + 6, curY + 12, { sz: 8.5, bold: true });
        txt('Complete at', PAD + 6, curY + 24, { sz: 7.5 });
        txt('end of day', PAD + 6, curY + 35, { sz: 7.5 });

        vline(PAD + 80, curY, curY + recapH, '#ccc');

        const r70X = PAD + 88;
        txt('70 Hour / 8 Day Drivers', r70X, curY + 12, { sz: 8.5, bold: true });
        txt('(Property-carrying, 70-hr/8-day cycle)', r70X, curY + 24, { sz: 7, color: '#666' });

        const totalOnDuty = rowHours[2] + rowHours[3];
        const subCols = [
            { head: 'A.', sub: 'On duty hours\ntoday (lines 3+4)', val: totalOnDuty.toFixed(2) },
            { head: 'B.', sub: 'Total on duty\nlast 7 days', val: '—' },
            { head: 'C.', sub: 'Hrs available\ntomorrow', val: '—' },
        ];

        subCols.forEach((sc, i) => {
            const scX = r70X + 180 + i * 110;
            txt(sc.head, scX, curY + 12, { sz: 8.5, bold: true });
            box(scX, curY + 16, 100, recapH - 22, '#fff', '#ccc', 0.6);
            sc.sub.split('\n').forEach((l, li) => {
                txt(l, scX + 4, curY + 28 + li * 11, { sz: 7, color: '#666' });
            });
            txt(sc.val, scX + 50, curY + 72, { sz: 11, bold: true, align: 'center', color: '#00414B' });
        });

        txt('*34-hr restart resets 70-hr cycle', W - PAD - 4, curY + recapH - 6, { sz: 7, color: '#888', align: 'right', italic: true });

        curY += recapH + 6;
        box(PAD / 2, PAD / 2, W - PAD, curY - PAD / 2 + 8, undefined, '#333', 1.5);

    }, [date, dateISO, timeline, totalMiles, dayMiles, carrier, truckNumber, fromLocation, toLocation, sheetNumber, totalSheets]);

    const handlePrint = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
            <html><head><title>ELD Log - ${date}</title>
            <style>body{margin:0;display:flex;justify-content:center;background:#fff;}
            img{max-width:100%;height:auto;}
            @media print{img{width:100%;page-break-after:always;}}</style>
            </head><body><img src="${dataUrl}" /></body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `ELD-Log-${dateISO}-Sheet${sheetNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 mb-8 overflow-hidden w-full" style={{ maxWidth: '960px' }}>
            <div className="bg-[#00414B] text-white px-5 py-2.5 flex items-center justify-between">
                <span className="font-bold text-sm">📋 Driver's Daily Log — {date}</span>
                <div className="flex items-center gap-3">
                    <span className="text-slate-300 text-xs">Sheet {sheetNumber} of {totalSheets}</span>
                    <button
                        onClick={handleDownload}
                        className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1 rounded-lg transition-all font-medium"
                    >
                        ⬇ Download
                    </button>
                    <button
                        onClick={handlePrint}
                        className="bg-[#FF6F61] hover:bg-[#e85d50] text-white text-xs px-3 py-1 rounded-lg transition-all font-medium"
                    >
                        🖨 Print
                    </button>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                width={920}
                height={720}
                className="block"
                style={{ width: '100%', height: 'auto' }}
            />
        </div>
    );
};

export default DailyLogSheet;
