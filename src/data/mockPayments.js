const getTimestamp = (daysAgo, hours, minutes) => {
  const date = new Date();

  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);

  return date.getTime();
};

const mockPayments = [
  {
    id: '1',
    message: 'NAVIN CHANDRA BAGOULI paid you',
    amount: 1.0,
    receivedAt: getTimestamp(0, 20, 45),
  },
  {
    id: '2',
    message: 'RAHUL SHARMA paid you',
    amount: 500.0,
    receivedAt: getTimestamp(0, 18, 20),
  },
  {
    id: '3',
    message: 'AMIT KUMAR paid you',
    amount: 250.0,
    receivedAt: getTimestamp(0, 15, 10),
  },
  {
    id: '4',
    message: 'PRIYA SHARMA paid you',
    amount: 1200.0,
    receivedAt: getTimestamp(1, 19, 30),
  },
  {
    id: '5',
    message: 'ROHIT VERMA paid you',
    amount: 750.0,
    receivedAt: getTimestamp(1, 11, 15),
  },
];

export default mockPayments;
