---
name: pdf-document-processing
description: Receive a multi-document PDF package, identify and split individual documents by type, file them into the correct deal record folder, and log receipt in RealNex.
homepage: https://www.realnex.com
metadata:
  {
    "openclaw":
      {
        "emoji": "📄",
        "requires": { "env": ["REALNEX_API_KEY", "REALNEX_BASE_URL", "DEAL_DOCS_BASE_PATH"] },
        "primaryEnv": "REALNEX_API_KEY",
      },
  }
---

# PDF Document Processing

Split incoming transaction document packages into individual files, name them correctly, file them in the deal folder, and log receipt in RealNex.

## Purpose

When a purchase agreement package, disclosure set, or counter offer package arrives as a single PDF, automatically break it into individual documents and organize them into the transaction's file structure. Eliminates manual splitting and filing.

## Trigger

- Telegram: "Process this PDF — [filename]" (file uploaded to Telegram)
- Email attachment received (via n8n email parser webhook)
- Manual: "Split this deal package for [property address]"

## Inputs Required

- PDF file (multi-document package)
- Property address or RealNex deal/transaction ID
- Document type hint (optional: "purchase agreement package", "disclosure package", "counter package")

## Steps

1. **Receive the PDF** file via Telegram file upload or n8n email parser.

2. **Identify the deal/transaction** in RealNex by address or ID.

3. **Analyze the PDF structure** using the nano-pdf skill (already in the OpenClaw stack):
   - Look for document headers, signature blocks, page count breaks, and document titles
   - Identify each document type within the package:
     - Purchase and Sale Agreement (PSA)
     - Addenda (numbered: Addendum 1, 2, etc.)
     - Seller Disclosure Statement
     - Lead Paint Disclosure
     - Counter Offer
     - Letter of Intent (LOI)
     - Due Diligence Checklist
     - Environmental / Phase 1 report
     - Title Commitment
     - Assignment Agreement

4. **Split the PDF** into individual files using the nano-pdf skill:
   - One file per identified document
   - Naming convention: `[YYYY-MM-DD]_[DocumentType]_[PropertyShortAddress].pdf`
   - Example: `2026-04-16_PSA_450W200N-AmericanFork.pdf`

5. **File each document** into the correct folder in the deal record:
   - Base path: `$DEAL_DOCS_BASE_PATH/[deal_id]/`
   - Subfolder structure:
     - `/contracts/` → PSA, Counter Offers, LOI
     - `/disclosures/` → Seller Disclosure, Lead Paint, Environmental
     - `/addenda/` → All addenda
     - `/title/` → Title Commitment
     - `/due-diligence/` → DD checklist, inspection reports

6. **Log receipt in RealNex** transaction notes:
   ```bash
   curl -X POST "$REALNEX_BASE_URL/transactions/[deal_id]/notes" \
     -H "Authorization: Bearer $REALNEX_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Documents Received and Filed",
       "body": "Received package on [date]. Split into: [list of doc names]. Filed to /[deal_id]/. Processed by OpenClaw.",
       "created_by": "OpenClaw"
     }'
   ```

7. **Confirm to Stockton** via Telegram:
   ```
   PDF processed ✓ — [N] documents split and filed
   [property address]
   Documents:
   • PSA — filed /contracts/
   • Addendum 1 — filed /addenda/
   • Seller Disclosure — filed /disclosures/
   [etc.]
   RealNex transaction log updated.
   ```

## Output

- Individual PDF files named by document type and date
- Filed into correct deal record subfolders
- RealNex transaction note with filing summary
- Telegram confirmation listing every document processed

## Definition of Done

All individual documents exist as separate files in the correct folder. RealNex transaction note confirms receipt. Stockton has been notified with the full document list.

## Error Handling

- Can't identify document type → Name the file `[date]_UNKNOWN_[page_range].pdf`, file in `/unsorted/`, and flag to Stockton: "Found [N] pages I couldn't identify. Filed in /unsorted/ — please review."
- PDF is encrypted/password-protected → Reply: "This PDF is password-protected. Send me the password or an unlocked version."
- RealNex deal not found → Create files locally and flag: "Couldn't match this PDF to a RealNex deal. Files saved to /unmatched/[date]/. Which deal should I file them under?"

## Utah/Stockton RE Notes

- Uses the `nano-pdf` skill already in the OpenClaw stack for actual PDF splitting logic
- Common incoming package types for Utah CRE: REPC (Real Estate Purchase Contract), commercial PSA, LoopNet/Crexi listing agreements, title commitment packages
- Deal docs base path is set in env var `DEAL_DOCS_BASE_PATH`
- Signback documents flow through the signback-tracker skill after filing here
