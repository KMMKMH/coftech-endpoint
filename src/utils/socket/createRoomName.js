const createChatRoom = (accountID, phone) => {
  return `agent_${accountID}_chat_${phone}`;
}

const createUserRoom = (accountID) => {
  return `room_bot_${accountID}`;
}

const createFilemanagerRoom = (accountID) => {
  return `room_filemanager_${accountID}`
}

module.exports = { createChatRoom, createUserRoom, createFilemanagerRoom };