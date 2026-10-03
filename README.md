# Daily work report

Type your tasks, click **Generate table**, then **Copy table** and paste into Excel or an email.
Date is filled automatically; Team and Member Name are set in `server/report.js`.

## Run
    npm run setup      # installs server + client dependencies
    npm run build      # builds the React app
    npm start          # http://localhost:3001

## Develop (two terminals)
    npm run dev:server   # API on :3001
    npm run dev:client   # React on :5173 (proxies /api)

## Change the format
Edit `server/report.js`: TEAM, MEMBER_NAME, HEADERS, colours.
