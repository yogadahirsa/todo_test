DROP TABLE IF EXISTS users;
CREATE TABLE users (
    uuid SERIAL PRIMARY KEY,
    name VARCHAR(200),
    username VARCHAR(200),
    password VARCHAR(200)
);

DROP TABLE IF EXISTS positions;
CREATE TABLE positions (
    uuid SERIAL PRIMARY KEY,
    name VARCHAR(200)
);

DROP TABLE IF EXISTS user_positions;
CREATE TABLE user_positions (
    uuid SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(uuid),
    position_id INTEGER REFERENCES positions(uuid)
);

DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    uuid SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(uuid),
    todo TEXT,
    start_date DATE,
    end_date DATE
);

insert into users (name,username,password) values ('budi','budidab','123');
insert into users (name,username,password) values ('sani','sanidab','123');
insert into positions (name) values ('manager');
insert into tasks (user_id,todo) values (2,'belajar laravel');
