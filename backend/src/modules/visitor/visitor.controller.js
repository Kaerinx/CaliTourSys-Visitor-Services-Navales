const service = require('./visitor.service');

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

exports.login = asyncHandler(async (req, res) => {
  const result = await service.login(req.body);
  res.json(result);
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  res.json({ user: await service.updateProfile(req.body, req.user) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  res.json(await service.changePassword(req.body, req.user));
});

exports.dashboardSummary = asyncHandler(async (req, res) => {
  res.json(await service.dashboardSummary(req.user));
});

exports.receptionistSummary = asyncHandler(async (req, res) => {
  res.json(await service.receptionistSummary(req.user));
});

exports.createVisitor = asyncHandler(async (req, res) => {
  const visitor = await service.createVisitor(req.body, req.user);
  res.status(201).json(visitor);
});

exports.listVisitors = asyncHandler(async (req, res) => {
  res.json(await service.listVisitors(req.query, req.user));
});

exports.listTouristCountLogs = asyncHandler(async (req, res) => {
  res.json(await service.listTouristCountLogs(req.query));
});

exports.listTouristCountLogEntries = asyncHandler(async (req, res) => {
  res.json(await service.listTouristCountLogEntries(req.params.id));
});

exports.touristLogAnalytics = asyncHandler(async (req, res) => {
  res.json(await service.touristLogAnalytics(req.query));
});

exports.getVisitor = asyncHandler(async (req, res) => {
  res.json(await service.getVisitor(req.params.id, req.user));
});

exports.updateVisitor = asyncHandler(async (req, res) => {
  res.json(await service.updateVisitor(req.params.id, req.body, req.user));
});

exports.updateVisitorStatus = asyncHandler(async (req, res) => {
  res.json(await service.updateVisitorStatus(req.params.id, req.body.status, req.user));
});

exports.deleteVisitor = asyncHandler(async (req, res) => {
  res.json(await service.deleteVisitor(req.params.id));
});

exports.createInquiry = asyncHandler(async (req, res) => {
  const inquiry = await service.createInquiry(req.body);
  res.status(201).json(inquiry);
});

exports.listInquiries = asyncHandler(async (req, res) => {
  res.json(await service.listInquiries(req.query));
});

exports.getInquiry = asyncHandler(async (req, res) => {
  res.json(await service.getInquiry(req.params.id));
});

exports.respondInquiry = asyncHandler(async (req, res) => {
  res.json(await service.respondInquiry(req.params.id, req.body, req.user));
});

exports.updateInquiryStatus = asyncHandler(async (req, res) => {
  res.json(await service.updateInquiryStatus(req.params.id, req.body.status));
});

exports.visitorSummary = asyncHandler(async (req, res) => {
  res.json(await service.visitorSummary(req.query, req.user));
});

exports.visitorTrend = asyncHandler(async (req, res) => {
  res.json(await service.visitorTrend(req.query, req.user));
});

exports.classification = asyncHandler(async (req, res) => {
  res.json(await service.classification(req.query, req.user));
});

exports.exportVisitorSummary = asyncHandler(async (req, res) => {
  const csv = await service.exportVisitorSummary(req.query, req.user);
  res.header('Content-Type', 'text/csv');
  res.attachment('visitor-summary.csv');
  res.send(csv);
});

exports.listEstablishments = asyncHandler(async (req, res) => {
  res.json(await service.listEstablishments());
});

exports.createEstablishment = asyncHandler(async (req, res) => {
  const establishment = await service.createEstablishment(req.body);
  res.status(201).json(establishment);
});

exports.updateEstablishment = asyncHandler(async (req, res) => {
  res.json(await service.updateEstablishment(req.params.id, req.body));
});

exports.deactivateEstablishment = asyncHandler(async (req, res) => {
  res.json(await service.deactivateEstablishment(req.params.id));
});

exports.listUsers = asyncHandler(async (req, res) => {
  res.json(await service.listUsers());
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await service.createUser(req.body);
  res.status(201).json(user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  res.json(await service.updateUser(req.params.id, req.body));
});

exports.deactivateUser = asyncHandler(async (req, res) => {
  res.json(await service.deactivateUser(req.params.id));
});
