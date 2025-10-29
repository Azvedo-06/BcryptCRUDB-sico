const users = [
    
];
let nextId = 1;

const addUser = (user) => {
    const newUser = { 
        id: nextId++,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash
    };
    users.push(newUser);
    return newUser;
};

const getUserName = (name) => {
    return users.find(u => u.name === name);
};

const getUserById = (id) => {
    return users.find(u => u.id === id);
}

const getAllUsers = () => {
    return users;
}


module.exports = { addUser, getUserName, getUserById, getAllUsers };