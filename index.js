'use strict';
require('dotenv').config();
// const fs = require('fs');
const { Octokit } = require("@octokit/core");

// Create a personal access token at https://github.com/settings/tokens/new?scopes=repo
const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN });


async function moveCardsFromColumnToColumn(sourceColumnId, destinationColumnId, dryRun = false) {
  const cards = (await octokit.request(`GET /projects/columns/${sourceColumnId}/cards`, {
    mediaType: {
      previews: ['inertia-preview'],
    },
  })).data;

  console.log(`Moving ${cards.length} cards.`);
  if (dryRun) return;
  await Promise.all(cards.map(async(card) => {
    await octokit.request(`POST /projects/columns/cards/${card.id}/moves`, {
      mediaType: {
        previews: ['inertia-preview'],
      },
      column_id: destinationColumnId,
      position: 'top',
    });
  }));
}

async function main() {
  const orgName = 'matrix-org';
  const projects = (await octokit.request(`GET /orgs/${orgName}/projects`, {
    mediaType: {
      previews: ['inertia-preview'],
    },
  })).data;
  const project = projects.find(project => project.name === `Christian's task list`);
  if (!project) {
    throw Error('Project not found!');
  }

  const columns = (await octokit.request(`GET /projects/${project.id}/columns`, {
    mediaType: {
      previews: ['inertia-preview'],
    },
  })).data;

  const doneThisWeekColumn = columns.find(item => item.name === `Done (this week)`);
  const doneLastWeekColumn = columns.find(item => item.name === `Done (last week)`);
  const doneBeforeColumn = columns.find(item => item.name === `Out the airlock (Tasks older than 2 weeks)`);
  if (!doneThisWeekColumn || !doneLastWeekColumn || !doneBeforeColumn) {
    throw Error('One of the columns was not found!');
  }

  await moveCardsFromColumnToColumn(doneLastWeekColumn.id, doneBeforeColumn.id);
  await moveCardsFromColumnToColumn(doneThisWeekColumn.id, doneLastWeekColumn.id);
}

main().catch(console.error);
