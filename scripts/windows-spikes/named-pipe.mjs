// Spike 1.1 (native-windows-desktop): how libuv creates a named pipe on
// Windows. Records whether a second bind to a taken name fails, the pipe's
// default DACL, and whether a client that connects through a machine name (the
// remote path, over SMB) is served. Run with Node on Windows; prints JSON.
import { execFileSync } from 'node:child_process';
import { connect, createServer } from 'node:net';
import { hostname } from 'node:os';

const name = `terminay-spike-${process.pid}`;
const local = `\\\\.\\pipe\\${name}`;
const result = { node: process.version, uv: process.versions.uv, pipe: local };

const listen = (path) =>
	new Promise((resolve) => {
		const server = createServer((socket) => socket.end('served\n'));
		server.once('error', (error) => resolve({ server: null, error: error.code ?? String(error) }));
		server.listen(path, () => resolve({ server, error: null }));
	});

const tryConnect = (path) =>
	new Promise((resolve) => {
		const socket = connect(path);
		const timer = setTimeout(() => {
			socket.destroy();
			resolve('timeout');
		}, 5_000);
		let data = '';
		socket.on('data', (chunk) => {
			data += chunk;
		});
		socket.on('end', () => {
			clearTimeout(timer);
			resolve(data.trim() === 'served' ? 'served' : `ended:${data.trim()}`);
		});
		socket.on('error', (error) => {
			clearTimeout(timer);
			resolve(`error:${error.code ?? String(error)}`);
		});
	});

const first = await listen(local);
result.firstBind = first.error ?? 'ok';
const second = await listen(local);
result.secondBind = second.error ?? 'ok (FIRST_PIPE_INSTANCE not set)';
second.server?.close();

try {
	result.acl = JSON.parse(
		execFileSync(
			'powershell.exe',
			[
				'-NoProfile',
				'-Command',
				`(Get-Acl -LiteralPath '${local}').Access | Select-Object @{n='identity';e={$_.IdentityReference.Value}},@{n='rights';e={$_.FileSystemRights.ToString()}},@{n='type';e={$_.AccessControlType.ToString()}} | ConvertTo-Json -Compress`,
			],
			{ encoding: 'utf8' },
		),
	);
} catch (error) {
	result.acl = `error: ${String(error.message ?? error).slice(0, 300)}`;
}

result.localClient = await tryConnect(local);
result.loopbackClient = await tryConnect(`\\\\localhost\\pipe\\${name}`);
result.machineNameClient = await tryConnect(`\\\\${hostname()}\\pipe\\${name}`);
first.server?.close();

console.log(JSON.stringify(result, null, 2));
