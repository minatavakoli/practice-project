import fs from 'fs';
import bodyParser from 'body-parser';
import jsonServer from 'json-server';
import jwt from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';

const server = jsonServer.create();
const router = jsonServer.router('./server/todos.json');
const userdb = JSON.parse(fs.readFileSync('./server/users.json', 'UTF-8'));

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789';

const expiresIn = '1h';

// Create a token from a payload
function createToken(payload) {
	return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
	return jwt.verify(token, SECRET_KEY, (err, decode) =>
		decode !== undefined ? decode : err
	);
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
	return (
		userdb.users.findIndex(
			(user) => user.email === email && user.password === password
		) !== -1
	);
}

// Register New User
server.post('/auth/register', (req, res) => {
	const { email, password } = req.body;

	if (isAuthenticated({ email, password }) === true) {
		const status = 401;
		const message = 'Email and Password already exist';
		res.status(status).json({ status, message });
		return;
	}

	const userId = uuidv4();

	fs.readFile('./server/users.json', (err, data) => {
		if (err) {
			const status = 401;
			const message = err;
			res.status(status).json({ status, message });
			return;
		}

		// Get current users data
		var data = JSON.parse(data.toString());

		//Add new user
		data.users.push({ id: userId, email: email, password: password }); //add some data
		var writeData = fs.writeFile(
			'./server/users.json',
			JSON.stringify(data),
			(err, result) => {
				// WRITE
				if (err) {
					const status = 401;
					const message = err;
					res.status(status).json({ status, message });
					return;
				}
			}
		);
	});

	// Create token for new user
	const access_token = createToken({ email, password, userId });
	res.status(200).json({ access_token });
});

// get todos
server.get('/todos', (req, res) => {
	var decoded = jwt_decode(req.headers.authorization.split(' ')[1]);

	fs.readFile('./server/todos.json', (err, data) => {
		if (err) {
			const status = 401;
			const message = err;
			res.status(status).json({ status, message });
			return;
		}

		// Get current users data
		var data = JSON.parse(data.toString());

		const todos = data.todos.filter((item) => item.userId == decoded.userId);
		res.status(200).json(todos);
	});
});

// add todos
server.post('/todos', (req, res) => {
	var decoded = jwt_decode(req.headers.authorization.split(' ')[1]);

	const tododId = uuidv4();

	fs.readFile('./server/todos.json', (err, data) => {
		if (err) {
			const status = 401;
			const message = err;
			res.status(status).json({ status, message });
			return;
		}

		// Get current users data
		var data = JSON.parse(data.toString());

		data.todos.push({
			id: tododId,
			userId: decoded.userId,
			text: req.body.text,
		});

		fs.writeFile('./server/todos.json', JSON.stringify(data), (err, result) => {
			// WRITE
			if (err) {
				const status = 401;
				const message = err;
				res.status(status).json({ status, message });
				return;
			}
		});

		res
			.status(200)
			.json({ id: tododId, userId: decoded.userId, text: req.body.text });
	});
});

// delete todo
server.delete('/todos/:id', (req, res) => {
	var decoded = jwt_decode(req.headers.authorization.split(' ')[1]);

	fs.readFile('./server/todos.json', (err, data) => {
		if (err) {
			const status = 401;
			const message = err;
			res.status(status).json({ status, message });
			return;
		}

		// Get current users data
		var data = JSON.parse(data.toString());

		const isTodoExist = data.todos.find((item) => item.id === req.params.id);
		if (!isTodoExist) {
			res.status(401).json({ status: 400, message: 'todo id is incorrect' });
			return;
		}

		const todo = data.todos.find((item) => item.userId === decoded.userId);
		if (!todo) {
			res
				.status(401)
				.json({ status: 400, message: 'todo is not belong to you' });
			return;
		}

		const todos = data.todos.filter((item) => item.id !== req.params.id);
		data.todos = todos;

		fs.writeFile('./server/todos.json', JSON.stringify(data), (err, result) => {
			// WRITE
			if (err) {
				const status = 401;
				const message = err;
				res.status(status).json({ status, message });
				return;
			}
		});

		res.status(200).json({ message: 'todo deleted successfully' });
	});
});

// patch todo
server.patch('/todos/:id', (req, res) => {
	var decoded = jwt_decode(req.headers.authorization.split(' ')[1]);

	fs.readFile('./server/todos.json', (err, data) => {
		if (err) {
			const status = 401;
			const message = err;
			res.status(status).json({ status, message });
			return;
		}

		// Get current users data
		var data = JSON.parse(data.toString());

		const isTodoExist = data.todos.find((item) => item.id === req.params.id);
		if (!isTodoExist) {
			res.status(401).json({ status: 400, message: 'todo id is incorrect' });
			return;
		}

		const todo = data.todos.find((item) => item.userId === decoded.userId);
		if (!todo) {
			res
				.status(401)
				.json({ status: 400, message: 'todo is not belong to you' });
			return;
		}

		const todos = data.todos.map((item) => {
			if (item.id === req.params.id) {
				return {
					...item,
					...req.body,
				};
			} else {
				return item;
			}
		});
		data.todos = todos;

		fs.writeFile('./server/todos.json', JSON.stringify(data), (err, result) => {
			// WRITE
			if (err) {
				const status = 401;
				const message = err;
				res.status(status).json({ status, message });
				return;
			}
		});

		res.status(200).json({ message: 'todo edited successfully' });
	});
});

// Login to one of the users from ./server/users.json
server.post('/auth/login', (req, res) => {
	console.log('login endpoint called; request body:');
	console.log(req.body);
	const { email, password } = req.body;
	if (isAuthenticated({ email, password }) === false) {
		const status = 401;
		const message = 'Incorrect email or password';
		res.status(status).json({ status, message });
		return;
	}
	const access_token = createToken({ email, password });
	console.log('Access Token:' + access_token);
	res.status(200).json({ access_token });
});

server.use(/^(?!\/auth).*$/, (req, res, next) => {
	if (
		req.headers.authorization === undefined ||
		req.headers.authorization.split(' ')[0] !== 'Bearer'
	) {
		const status = 401;
		const message = 'Error in authorization format';
		res.status(status).json({ status, message });
		return;
	}
	try {
		let verifyTokenResult;
		verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

		if (verifyTokenResult instanceof Error) {
			const status = 401;
			const message = 'Access token not provided';
			res.status(status).json({ status, message });
			return;
		}
		next();
	} catch (err) {
		const status = 401;
		const message = 'Error access_token is revoked';
		res.status(status).json({ status, message });
	}
});

server.use(router);

server.listen(8000, () => {
	console.log('server: http://localhost:8000');

});
