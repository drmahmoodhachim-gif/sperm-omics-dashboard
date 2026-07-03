#!/usr/bin/env Rscript
# Local DESeq2 analysis for RNA-seq count matrices
# Usage: Rscript scripts/deseq2/analyze.R counts.csv sample_groups.csv output_dir
# counts.csv: genes as rows, samples as columns (first col = gene_id)
# sample_groups.csv: sample_id, group (control/case)

args <- commandArgs(trailingOnly = TRUE)
if (length(args) < 3) {
  stop("Usage: Rscript analyze.R <counts.csv> <sample_groups.csv> <output_dir>")
}

counts_file <- args[1]
groups_file <- args[2]
out_dir <- args[3]
dir.create(out_dir, showWarnings = FALSE, recursive = TRUE)

if (!requireNamespace("DESeq2", quietly = TRUE)) {
  stop("Install DESeq2: BiocManager::install('DESeq2')")
}
if (!requireNamespace("readr", quietly = TRUE)) {
  stop("Install readr: install.packages('readr')")
}

suppressPackageStartupMessages({
  library(DESeq2)
  library(readr)
})

counts <- as.matrix(read.csv(counts_file, row.names = 1, check.names = FALSE))
groups <- read.csv(groups_file, stringsAsFactors = FALSE)
colnames(groups) <- c("sample", "group")

dds <- DESeqDataSetFromMatrix(
  countData = counts[, groups$sample, drop = FALSE],
  colData = data.frame(group = factor(groups$group), row.names = groups$sample),
  design = ~ group
)
dds <- DESeq(dds)
res <- results(dds)
res_df <- as.data.frame(res[order(res$padj), ])
res_df$gene <- rownames(res_df)

write.csv(res_df, file.path(out_dir, "deseq2_results.csv"), row.names = FALSE)
cat("DESeq2 complete:", nrow(res_df), "genes ->", file.path(out_dir, "deseq2_results.csv"), "\n")
