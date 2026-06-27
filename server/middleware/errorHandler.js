const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Email đã được sử dụng' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'ID không hợp lệ' });
  }

  if (err.message === 'Chỉ hỗ trợ file PDF') {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File quá lớn (tối đa 10MB)' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Lỗi server nội bộ',
  });
};

module.exports = errorHandler;
