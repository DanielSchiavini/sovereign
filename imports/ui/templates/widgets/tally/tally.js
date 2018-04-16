import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from 'meteor/tap:i18n';
import { Meteor } from 'meteor/meteor';

import { query } from '/lib/views';
import { here } from '/lib/utils';
import { Transactions } from '/imports/api/transactions/Transactions';
import { displayNotice } from '/imports/ui/modules/notice';

import '/imports/ui/templates/widgets/tally/tally.html';

/**
* @summary translates data info about vote into a renderable contracts
* @param {object} post a transaction Object
*/
const _voteToContract = (post) => {
  console.log(post);
  return {
    contract: {
      _id: post.contractId, // `txId-${post._id}-${post.contractId}`,
      timestamp: post.timestamp,
      wallet: {
        balance: post.input.quantity,
      },
      title: '',
    },
    ballot: post.condition.ballot,
    senderId: post.input.entityId,
    receiverId: post.output.entityId,
    isVote: true,
  };
};

Template.tally.onCreated(function () {
  Template.instance().feed = new ReactiveVar();
  Template.instance().contractId = new ReactiveVar();

  const instance = this;

  Meteor.call('getContractId', Template.currentData().options.keyword, function (error, result) {
    if (result) {
      instance.contractId.set(result);
    } else if (error) {
      console.log(error);
    }
  });

  this.subscription = instance.subscribe('tally', Template.currentData().options);
});

Template.tally.onRendered(function () {
  const instance = this;
  instance.autorun(function () {
    const contractId = instance.contractId.get();

    if (contractId) {
      Template.currentData().options.contractId = contractId;
      const parameters = query(Template.currentData().options);
      const dbQuery = Transactions.find(parameters.find, parameters.options);

      instance.handle = dbQuery.observeChanges({
        changed: () => {
          displayNotice(TAPi18n.__('notify-new-posts'), true);
        },
        addedBefore: (id, fields) => {
          // added stuff
          const currentFeed = instance.feed.get();
          const post = fields;
          const contract = _voteToContract(post);
          post._id = id;
          if (!currentFeed) {
            instance.feed.set([contract]);
          } else if (!here(contract, currentFeed)) {
            currentFeed.push(contract);
            instance.feed.set(_.uniq(currentFeed));
          }
        },
      });
    }
  });
});

Template.tally.helpers({
  vote() {
    return Template.instance().feed.get();
  },
  ready() {
    return Template.instance().contractId.get();
  },
});
