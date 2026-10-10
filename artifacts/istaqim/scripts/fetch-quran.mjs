name: Fetch Quran
on:
  workflow_dispatch:
permissions:
  contents: write
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Download and verify
        run: node artifacts/istaqim/scripts/fetch-quran.mjs
      - name: Commit data
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add artifacts/istaqim/data
          git diff --cached --quiet || git commit -m "Add Quran data (verified)"
          git push
