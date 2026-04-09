const STORAGE_KEY = 'halo-night-stat-tracker-v1';

const defaultRoster = [
  'Jacob (B33BE)',
  'Jack (Inexorable Wolf)',
  'Josh S (Schuby90)',
  'Josh (Y4RCOS)',
  'Ben (Carbos Reaper)',
  'Josh O (Space Travler568)',
  'Riley (Indoo)',
  'Isaiah (buddistgamer666)',
  'Hayden (uphillplague691)',
  'Tobias (TBH)',
  'Angela (Sterky)',
  'Reuben (Pocket)'
];

const placingOptions = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const placingPoints = {
  '1st': 9,
  '2nd': 7,
  '3rd': 5,
  '4th': 3,
  '5th': 1,
  '6th': 1,
  '7th': 1,
  '8th': 1
};

const state = loadState();

const elements = {
  eventNameInput: document.getElementById('eventNameInput'),
  createEventBtn: document.getElementById('createEventBtn'),
  eventSelect: document.getElementById('eventSelect'),
  renameEventBtn: document.getElementById('renameEventBtn'),
  deleteEventBtn: document.getElementById('deleteEventBtn'),
  gameNo: document.getElementById('gameNo'),
  submitGameBtn: document.getElementById('submitGameBtn'),
  clearEntryBtn: document.getElementById('clearEntryBtn'),
  entryBody: document.getElementById('entryBody'),
  gamesBody: document.getElementById('gamesBody'),
  resultsBody: document.getElementById('resultsBody'),
  exportEventExcelBtn: document.getElementById('exportEventExcelBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importInput: document.getElementById('importInput')
};

wireEvents();
renderAll();

function wireEvents() {
  elements.createEventBtn.addEventListener('click', createEvent);
  elements.eventSelect.addEventListener('change', onEventChange);
  elements.renameEventBtn.addEventListener('click', renameEvent);
  elements.deleteEventBtn.addEventListener('click', deleteEvent);
  elements.submitGameBtn.addEventListener('click', submitGame);
  elements.clearEntryBtn.addEventListener('click', () => {
    clearEntryStats();
    renderEntryTable();
  });
  elements.exportEventExcelBtn.addEventListener('click', exportCurrentEventExcel);
  elements.exportBtn.addEventListener('click', exportData);
  elements.importInput.addEventListener('change', importData);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.events && parsed.currentEventId) {
        return parsed;
      }
    } catch {
      // ignore broken storage and recreate defaults
    }
  }

  const initialEventId = crypto.randomUUID();
  return {
    currentEventId: initialEventId,
    events: [
      {
        id: initialEventId,
        name: 'Default Event',
        roster: [...defaultRoster],
        games: [],
        nextGameNo: 1,
        entryRows: buildEmptyEntryRows(defaultRoster)
      }
    ]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getCurrentEvent() {
  return state.events.find((evt) => evt.id === state.currentEventId);
}

function renderAll() {
  renderEventDropdown();
  renderEntryTable();
  renderGamesTable();
  renderResultsTable();
  const current = getCurrentEvent();
  elements.gameNo.value = current.nextGameNo;
  saveState();
}

function renderEventDropdown() {
  elements.eventSelect.innerHTML = '';
  state.events.forEach((evt) => {
    const option = document.createElement('option');
    option.value = evt.id;
    option.textContent = evt.name;
    if (evt.id === state.currentEventId) {
      option.selected = true;
    }
    elements.eventSelect.appendChild(option);
  });
}

function buildEmptyEntryRows(roster) {
  return roster.map((player) => ({
    player,
    kills: 0,
    assists: 0,
    deaths: 0,
    placing: '',
    points: 0,
    timeObjSec: 0,
    captures: 0
  }));
}

function renderEntryTable() {
  const current = getCurrentEvent();
  elements.entryBody.innerHTML = '';

  current.entryRows.forEach((row, idx) => {
    row.points = getPointsForPlacing(row.placing);
    const tr = document.createElement('tr');

    tr.appendChild(createEditableCell(row.player, (value) => {
      row.player = value.trim();
    }));
    tr.appendChild(createNumericCell(row.kills, (value) => (row.kills = value)));
    tr.appendChild(createNumericCell(row.assists, (value) => (row.assists = value)));
    tr.appendChild(createNumericCell(row.deaths, (value) => (row.deaths = value)));
    tr.appendChild(
      createPlacingCell(row.placing, (value) => {
        row.placing = value;
        row.points = getPointsForPlacing(value);
      })
    );
    tr.appendChild(createAutoPointsCell(row.points));
    tr.appendChild(createNumericCell(row.timeObjSec, (value) => (row.timeObjSec = value)));
    tr.appendChild(createNumericCell(row.captures, (value) => (row.captures = value)));

    elements.entryBody.appendChild(tr);
  });

  const addRow = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 8;
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Player Row';
  addBtn.className = 'secondary';
  addBtn.addEventListener('click', () => {
    current.entryRows.push({
      player: '',
      kills: 0,
      assists: 0,
      deaths: 0,
      placing: '',
      points: 0,
      timeObjSec: 0,
      captures: 0
    });
    renderAll();
  });
  td.appendChild(addBtn);
  addRow.appendChild(td);
  elements.entryBody.appendChild(addRow);
}

function createEditableCell(value, onChange) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'entry-input';
  input.value = value ?? '';
  input.addEventListener('input', () => {
    onChange(input.value);
    saveState();
  });
  td.appendChild(input);
  return td;
}

function createNumericCell(value, onChange) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.className = 'entry-input';
  input.value = Number(value || 0);
  input.addEventListener('input', () => {
    onChange(Number(input.value) || 0);
    saveState();
  });
  td.appendChild(input);
  return td;
}

function createAutoPointsCell(value) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'entry-input';
  input.value = Number(value || 0);
  input.readOnly = true;
  input.title = 'Auto-calculated from placing';
  td.appendChild(input);
  return td;
}

function createPlacingCell(value, onChange) {
  const td = document.createElement('td');
  const select = document.createElement('select');
  select.className = 'entry-select';
  placingOptions.forEach((placement) => {
    const opt = document.createElement('option');
    opt.value = placement;
    opt.textContent = placement;
    if (placement === value) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  select.addEventListener('change', () => {
    onChange(select.value);
    saveState();
  });
  td.appendChild(select);
  return td;
}

function clearEntryStats() {
  const current = getCurrentEvent();
  current.entryRows = current.entryRows.map((r) => ({
    ...r,
    kills: 0,
    assists: 0,
    deaths: 0,
    placing: '',
    points: 0,
    timeObjSec: 0,
    captures: 0
  }));
  saveState();
}

function submitGame() {
  const current = getCurrentEvent();
  const rows = current.entryRows
    .filter((row) => row.player.trim().length > 0)
    .map((row) => ({
      ...row,
      player: row.player.trim(),
      points: getPointsForPlacing(row.placing)
    }));

  if (rows.length === 0) {
    alert('No players found. Please add at least one player row before submitting.');
    return;
  }

  current.games.push({
    id: crypto.randomUUID(),
    gameNo: current.nextGameNo,
    dateISO: new Date().toISOString(),
    rows
  });

  current.nextGameNo += 1;
  clearEntryStats();
  renderAll();
}

function renderGamesTable() {
  const current = getCurrentEvent();
  elements.gamesBody.innerHTML = '';

  if (current.games.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'No games submitted yet.';
    tr.appendChild(td);
    elements.gamesBody.appendChild(tr);
    return;
  }

  current.games
    .slice()
    .sort((a, b) => a.gameNo - b.gameNo)
    .forEach((game) => {
      const tr = document.createElement('tr');
      const totalPoints = game.rows.reduce((sum, row) => sum + (Number(row.points) || 0), 0);

      tr.innerHTML = `
        <td>${game.gameNo}</td>
        <td>${new Date(game.dateISO).toLocaleString()}</td>
        <td>${game.rows.length}</td>
        <td>${totalPoints}</td>
      `;

      const actionCell = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'small-btn secondary';
      editBtn.addEventListener('click', () => editGame(game.id));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'small-btn danger';
      deleteBtn.addEventListener('click', () => deleteGame(game.id));

      actionCell.appendChild(editBtn);
      actionCell.appendChild(deleteBtn);
      tr.appendChild(actionCell);
      elements.gamesBody.appendChild(tr);
    });
}

function editGame(gameId) {
  const current = getCurrentEvent();
  const game = current.games.find((g) => g.id === gameId);
  if (!game) return;

  const removeAfterLoad = confirm(
    `Load Game #${game.gameNo} into entry table for editing?\n\n` +
      'Press OK to load and remove the old saved version (recommended).\n' +
      'Press Cancel to only load a copy for reference.'
  );

  current.entryRows = game.rows.map((row) => ({ ...row }));
  current.nextGameNo = game.gameNo;

  if (removeAfterLoad) {
    current.games = current.games.filter((g) => g.id !== gameId);
  }

  renderAll();
}

function deleteGame(gameId) {
  const current = getCurrentEvent();
  const game = current.games.find((g) => g.id === gameId);
  if (!game) return;

  const confirmed = confirm(`Delete Game #${game.gameNo}? This cannot be undone.`);
  if (!confirmed) return;

  current.games = current.games.filter((g) => g.id !== gameId);

  const highest = current.games.reduce((max, g) => Math.max(max, g.gameNo), 0);
  current.nextGameNo = highest + 1;

  renderAll();
}

function aggregateRows(rows) {
  const byPlayer = new Map();

  rows.forEach((row) => {
    const key = row.player;
    if (!byPlayer.has(key)) {
      byPlayer.set(key, {
        player: key,
        kills: 0,
        assists: 0,
        deaths: 0,
        captures: 0,
        timeObjSec: 0,
        points: 0,
        placings: {
          '1st': 0,
          '2nd': 0,
          '3rd': 0,
          '4th': 0,
          '5th': 0,
          '6th': 0,
          '7th': 0,
          '8th': 0
        }
      });
    }

    const item = byPlayer.get(key);
    item.kills += Number(row.kills) || 0;
    item.assists += Number(row.assists) || 0;
    item.deaths += Number(row.deaths) || 0;
    item.captures += Number(row.captures) || 0;
    item.timeObjSec += Number(row.timeObjSec) || 0;
    item.points += getPointsForPlacing(row.placing);
    if (item.placings[row.placing] !== undefined) {
      item.placings[row.placing] += 1;
    }
  });

  return [...byPlayer.values()].sort((a, b) => b.points - a.points);
}

function getPointsForPlacing(placing) {
  return placingPoints[placing] ?? 0;
}

function renderResultsTable() {
  const current = getCurrentEvent();
  const allRows = current.games.flatMap((game) => game.rows);
  const totals = aggregateRows(allRows);

  elements.resultsBody.innerHTML = '';

  if (totals.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 10;
    td.textContent = 'No submitted game data yet.';
    tr.appendChild(td);
    elements.resultsBody.appendChild(tr);
    return;
  }

  totals.forEach((player) => {
    const kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills.toFixed(2);
    const kda = player.deaths > 0
      ? ((player.kills + player.assists * 0.3) / player.deaths).toFixed(2)
      : (player.kills + player.assists * 0.3).toFixed(2);

    const placingText = `1st: ${player.placings['1st']}, 2nd: ${player.placings['2nd']}, 3rd: ${player.placings['3rd']}, 4th: ${player.placings['4th']}, 5th: ${player.placings['5th']}, 6th: ${player.placings['6th']}, 7th: ${player.placings['7th']}, 8th: ${player.placings['8th']}`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${player.player}</td>
      <td>${player.kills}</td>
      <td>${player.assists}</td>
      <td>${player.deaths}</td>
      <td>${kd}</td>
      <td>${kda}</td>
      <td>${player.captures}</td>
      <td>${player.timeObjSec}</td>
      <td>${placingText}</td>
      <td>${player.points}</td>
    `;
    elements.resultsBody.appendChild(tr);
  });
}

function createEvent() {
  const name = elements.eventNameInput.value.trim();
  if (!name) {
    alert('Please enter a name for the event.');
    return;
  }

  const evt = {
    id: crypto.randomUUID(),
    name,
    roster: [...defaultRoster],
    games: [],
    nextGameNo: 1,
    entryRows: buildEmptyEntryRows(defaultRoster)
  };

  state.events.push(evt);
  state.currentEventId = evt.id;
  elements.eventNameInput.value = '';
  renderAll();
}

function onEventChange() {
  state.currentEventId = elements.eventSelect.value;
  renderAll();
}

function renameEvent() {
  const current = getCurrentEvent();
  const name = prompt('Enter a new event name:', current.name);
  if (!name || !name.trim()) return;
  current.name = name.trim();
  renderAll();
}

function deleteEvent() {
  if (state.events.length === 1) {
    alert('At least one event must exist. Create another event before deleting this one.');
    return;
  }

  const current = getCurrentEvent();
  const confirmed = confirm(
    `Delete event "${current.name}" and all its games? This cannot be undone.`
  );

  if (!confirmed) return;

  state.events = state.events.filter((evt) => evt.id !== current.id);
  state.currentEventId = state.events[0].id;
  renderAll();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `halo-night-stats-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildSpreadsheetRow(values) {
  return `<Row>${values
    .map((v) => `<Cell><Data ss:Type=\"String\">${escapeXml(v)}</Data></Cell>`)
    .join('')}</Row>`;
}

function exportCurrentEventExcel() {
  const current = getCurrentEvent();
  if (!current) return;

  if (!current.games.length) {
    alert('This event has no submitted games yet.');
    return;
  }

  const flatRows = current.games
    .slice()
    .sort((a, b) => a.gameNo - b.gameNo)
    .flatMap((game) =>
      game.rows.map((row) => ({
        gameNo: game.gameNo,
        date: new Date(game.dateISO).toLocaleString(),
        player: row.player,
        kills: Number(row.kills) || 0,
        assists: Number(row.assists) || 0,
        deaths: Number(row.deaths) || 0,
        placing: row.placing || '',
        points: getPointsForPlacing(row.placing),
        timeObjSec: Number(row.timeObjSec) || 0,
        captures: Number(row.captures) || 0
      }))
    );

  const totals = aggregateRows(flatRows);

  const xmlHeader = `<?xml version=\"1.0\"?>\n<?mso-application progid=\"Excel.Sheet\"?>`;
  const workbookStart = `<Workbook xmlns=\"urn:schemas-microsoft-com:office:spreadsheet\" xmlns:o=\"urn:schemas-microsoft-com:office:office\" xmlns:x=\"urn:schemas-microsoft-com:office:excel\" xmlns:ss=\"urn:schemas-microsoft-com:office:spreadsheet\">`;
  const workbookEnd = '</Workbook>';

  const gameDataSheetRows = [
    buildSpreadsheetRow([
      'Game #',
      'Date',
      'Player Name',
      'Kills',
      'Assists',
      'Deaths',
      'Placing',
      'Points',
      'Time Obj (sec)',
      'Captures'
    ]),
    ...flatRows.map((r) =>
      buildSpreadsheetRow([
        r.gameNo,
        r.date,
        r.player,
        r.kills,
        r.assists,
        r.deaths,
        r.placing,
        r.points,
        r.timeObjSec,
        r.captures
      ])
    )
  ].join('');

  const resultsSheetRows = [
    buildSpreadsheetRow([
      'Player',
      'Total Kills',
      'Total Assists',
      'Total Deaths',
      'K/D',
      'KDA (A=0.3)',
      'Captures',
      'Obj Time (sec)',
      'Placings',
      'Total Points'
    ]),
    ...totals.map((player) => {
      const kd = player.deaths > 0 ? (player.kills / player.deaths).toFixed(2) : player.kills.toFixed(2);
      const kda =
        player.deaths > 0
          ? ((player.kills + player.assists * 0.3) / player.deaths).toFixed(2)
          : (player.kills + player.assists * 0.3).toFixed(2);
      const placingText = `1st: ${player.placings['1st']}, 2nd: ${player.placings['2nd']}, 3rd: ${player.placings['3rd']}, 4th: ${player.placings['4th']}, 5th: ${player.placings['5th']}, 6th: ${player.placings['6th']}, 7th: ${player.placings['7th']}, 8th: ${player.placings['8th']}`;

      return buildSpreadsheetRow([
        player.player,
        player.kills,
        player.assists,
        player.deaths,
        kd,
        kda,
        player.captures,
        player.timeObjSec,
        placingText,
        player.points
      ]);
    })
  ].join('');

  const workbookXml = [
    xmlHeader,
    workbookStart,
    `<Worksheet ss:Name=\"Game Data\"><Table>${gameDataSheetRows}</Table></Worksheet>`,
    `<Worksheet ss:Name=\"Results\"><Table>${resultsSheetRows}</Table></Worksheet>`,
    workbookEnd
  ].join('');

  const safeEventName = current.name.replace(/[^a-zA-Z0-9-_]+/g, '_');
  const fileName = `${safeEventName || 'event'}-${new Date().toISOString().slice(0, 10)}.xls`;

  const blob = new Blob([workbookXml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || !Array.isArray(parsed.events) || !parsed.currentEventId) {
        throw new Error('Invalid file format.');
      }

      state.events = parsed.events;
      state.currentEventId = parsed.currentEventId;
      renderAll();
      alert('Data imported successfully.');
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}
