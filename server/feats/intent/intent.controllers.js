/*
 * Copyright (c) AXA Shared Services Spain S.A.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const app = require('../../app');
const { AgentStatus } = require('../agent/agent.constants');

const modelName = 'intent';

/**
 * Adds a new intent.
 * @param {object} request Request
 */
async function add(request) {
  const updateData = JSON.parse(request.payload);
  const agentName = updateData.agent;
  const agent = await app.database.findOne('agent', { agentName });
  if (!agent) {
    return app.error(404, 'The agent was not found');
  }
  const { domainName } = updateData;
  const domain = await app.database.findOne('domain', { domainName });
  if (!domain) {
    return app.error(404, 'The domain was not found');
  }
  agent.status = AgentStatus.OutOfDate;
  await app.database.saveItem(agent);
  updateData.status = 'Ready';
  // eslint-disable-next-line no-underscore-dangle
  updateData.agent = agent._id.toString();
  // eslint-disable-next-line no-underscore-dangle
  updateData.domain = domain._id.toString();
  return app.database.save(modelName, updateData);
}

/**
 * Finds an intent by id.
 * @param {object} request Request.
 */
async function findById(request) {
  const intentId = request.params.id;
  const intent = await app.database.findById(modelName, intentId);
  if (!intent) {
    return app.error(404, 'The intent was not found');
  }
  const agent = await app.database.findById('agent', intent.agent);
  if (!agent) {
    return app.error(404, 'The agent was not found');
  }
  intent.agentName = agent.agentName;
  const domain = await app.database.findById('domain', intent.domain);
  if (!domain) {
    return app.error(404, 'The domain was not found');
  }
  intent.domainName = domain.domainName;
  return intent;
}

/**
 * Delete intent by id.
 * @param {object} request Request
 */
async function deleteById(request) {
  const intentId = request.params.id;
  const intent = await app.database.findById(modelName, intentId);
  if (intent) {
    const agent = await app.database.findById('agent', intent.agent);
    if (agent) {
      agent.status = AgentStatus.OutOfDate;
      await app.database.saveItem(agent);
    }
  }
  app.database.remove('scenario', { intent: intentId });
  return app.database.removeById(modelName, intentId);
}

/**
 * Update intent by id.
 * @param {object} request Request
 */
async function updateById(request) {
  const intentId = request.params.id;
  const intent = await app.database.findById(modelName, intentId);
  if (intent) {
    const agent = await app.database.findById('agent', intent.agent);
    if (agent) {
      agent.status = AgentStatus.OutOfDate;
      await app.database.saveItem(agent);
    }
  }
  const data = JSON.parse(request.payload);
  return app.database.updateById(modelName, intentId, data);
}

/**
 * Adds scenario to the intent.
 * @param {object} request Request
 */
async function addScenario(request) {
  const updateData = JSON.parse(request.payload);
  const agentName = updateData.agent;
  let agent = await app.database.findOne('agent', { agentName });
  if (!agent) {
    agent = await app.database.findById('agent', agentName);
    if (!agent) {
      return app.error(404, 'The agent was not found');
    }
  }
  let { domainName } = updateData;
  if (!domainName) {
    domainName = updateData.domain;
  }
  let domain = await app.database.findOne('domain', { domainName });
  if (!domain) {
    domain = await app.database.findById('domain', domainName);
    if (!domain) {
      return app.error(404, 'The domain was not found');
    }
  }
  const intentName = updateData.intent;
  const intent = await app.database.findOne('intent', {
    intentName,
    domain: domain._id,
  });
  if (!intent) {
    return app.error(404, 'The intent was not found');
  }
  // eslint-disable-next-line no-underscore-dangle
  app.database.remove('scenario', { intent: intent._id });
  agent.status = AgentStatus.OutOfDate;
  await app.database.saveItem(agent);
  // eslint-disable-next-line no-underscore-dangle
  updateData.agent = agent._id.toString();
  // eslint-disable-next-line no-underscore-dangle
  updateData.domain = domain._id.toString();
  // eslint-disable-next-line no-underscore-dangle
  updateData.intent = intent._id.toString();
  return app.database.save('scenario', updateData);
}

/**
 * Update scenario.
 * @param {object} request Request
 */
async function updateScenario(request) {
  const updateData = JSON.parse(request.payload);
  const intentId = request.params.id;
  const scenario = await app.database.findOne('scenario', { intent: intentId });
  if (!scenario) {
    return app.error(404, 'The scenario was not found');
  }
  const agent = await app.database.findById('agent', scenario.agent);
  if (agent) {
    agent.status = AgentStatus.OutOfDate;
    await app.database.saveItem(agent);
  }
  // eslint-disable-next-line no-underscore-dangle
  return app.database.updateById('scenario', scenario._id, updateData);
}

/**
 * Delete scenario.
 * @param {object} request Request
 */
async function deleteScenario(request) {
  const intentId = request.params.id;
  const intentFilter = { intent: intentId };
  const scenario = await app.database.findOne('scenario', intentFilter);
  if (!scenario) {
    return app.error(404, 'The scenario was not found');
  }
  const agent = await app.database.findById('agent', scenario.agent);
  if (agent) {
    agent.status = AgentStatus.OutOfDate;
    await app.database.saveItem(agent);
  }
  return app.database.remove('scenario', intentFilter);
}

/**
 * Find scenario
 * @param {object} request Request
 */
async function findScenario(request) {
  const intentId = request.params.id;
  const intent = await app.database.findById(modelName, intentId);
  if (!intent) {
    return app.error(404, 'The intent was not found');
  }
  const scenario = await app.database.findOne('scenario', { intent: intentId });
  if (!scenario) {
    return app.error(404, 'The scenario was not found');
  }
  const agent = await app.database.findById('agent', scenario.agent);
  if (!agent) {
    return app.error(404, 'The agent was not found');
  }
  const domain = await app.database.findById('domain', scenario.domain);
  if (!domain) {
    return app.error(404, 'The domain was not found');
  }
  scenario.agentName = agent.agentName;
  scenario.domainName = domain.domainName;
  scenario.intentName = intent.intentName;
  return scenario;
}

module.exports = {
  add,
  findById,
  deleteById,
  updateById,
  addScenario,
  findScenario,
  deleteScenario,
  updateScenario,
};
