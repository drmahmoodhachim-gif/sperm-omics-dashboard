"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

const COLORS = {
  up: "#ef4444",
  down: "#3b82f6",
  ns: "#94a3b8",
  primary: "#0d9488",
  secondary: "#64748b",
};

interface VolcanoPoint {
  name: string;
  log2FC: number;
  negLog10P: number;
  significant: boolean;
  direction: string;
}

export function VolcanoPlot({ data }: { data: VolcanoPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          dataKey="log2FC"
          name="log2 FC"
          domain={[-3, 3]}
          label={{ value: "log₂ Fold Change", position: "bottom", offset: 20, style: { fontSize: 12 } }}
        />
        <YAxis
          type="number"
          dataKey="negLog10P"
          name="-log10(p)"
          label={{ value: "-log₁₀(p-value)", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
        />
        <ReferenceLine x={-1} stroke="#cbd5e1" strokeDasharray="4 4" />
        <ReferenceLine x={1} stroke="#cbd5e1" strokeDasharray="4 4" />
        <ReferenceLine y={1.3} stroke="#cbd5e1" strokeDasharray="4 4" />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.[0]) return null;
            const d = payload[0].payload as VolcanoPoint;
            return (
              <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
                <p className="font-semibold">{d.name}</p>
                <p>log₂FC: {d.log2FC.toFixed(2)}</p>
                <p>-log₁₀(p): {d.negLog10P.toFixed(2)}</p>
              </div>
            );
          }}
        />
        <Scatter data={data} fill="#8884d8">
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.significant
                  ? entry.direction === "up"
                    ? COLORS.up
                    : COLORS.down
                  : COLORS.ns
              }
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

interface BarCategory {
  name: string;
  count: number;
}

export function OmicsBarChart({ data }: { data: BarCategory[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, bottom: 60, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          angle={-35}
          textAnchor="end"
          interval={0}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PathwayItem {
  name: string;
  geneRatio: string;
  pValue: number;
  count: number;
}

export function PathwayChart({ data }: { data: PathwayItem[] }) {
  const chartData = data.map((d) => ({
    ...d,
    negLog10P: -Math.log10(d.pValue),
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, bottom: 5, left: 140 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.[0]) return null;
            const d = payload[0].payload as PathwayItem & { negLog10P: number };
            return (
              <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
                <p className="font-semibold">{d.name}</p>
                <p>Genes: {d.geneRatio}</p>
                <p>p-value: {d.pValue.toExponential(1)}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="negLog10P" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PCAPoint {
  x: number;
  y: number;
  group: string;
  sample: string;
}

const GROUP_COLORS: Record<string, string> = {
  Fertile: "#0d9488",
  Infertile: "#ef4444",
  Control: "#0d9488",
  OAT: "#f59e0b",
  iNOA: "#8b5cf6",
};

export function PCAPlot({ data, variance }: { data: PCAPoint[]; variance?: { pc1: number; pc2: number } }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          dataKey="x"
          label={{
            value: variance ? `PC1 (${variance.pc1}% variance)` : "PC1",
            position: "bottom",
            offset: 20,
            style: { fontSize: 12 },
          }}
        />
        <YAxis
          type="number"
          dataKey="y"
          label={{
            value: variance ? `PC2 (${variance.pc2}% variance)` : "PC2",
            angle: -90,
            position: "insideLeft",
            style: { fontSize: 12 },
          }}
        />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.[0]) return null;
            const d = payload[0].payload as PCAPoint;
            return (
              <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
                <p className="font-semibold">{d.sample}</p>
                <p>Group: {d.group}</p>
              </div>
            );
          }}
        />
        <Scatter data={data}>
          {data.map((entry, i) => (
            <Cell key={i} fill={GROUP_COLORS[entry.group] ?? COLORS.secondary} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

interface TableData {
  columns: string[];
  rows: string[][];
}

export function PublicationTable({ data }: { data: TableData }) {
  return (
    <div className="overflow-x-auto">
      <table className="publication-table">
        <thead>
          <tr>
            {data.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-muted/30"}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
