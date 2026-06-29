export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Form Mitra AI Server Running!',
    status: 'online'
  });
}