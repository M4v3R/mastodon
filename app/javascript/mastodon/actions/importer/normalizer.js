import escapeTextContentForBrowser from 'escape-html';
import emojify from '../../features/emoji/emoji';

const domParser = new DOMParser();

export function normalizeAccount(account) {
  account = { ...account };

  const displayName = account.display_name.length === 0 ? account.username : account.display_name;
  account.display_name_html = emojify(escapeTextContentForBrowser(displayName));
  account.note_emojified = emojify(account.note);

  return account;
}

export function normalizeStatus(status, normalOldStatus) {
  const normalStatus   = { ...status };
  normalStatus.account = status.account.id;

  if (status.reblog && status.reblog.id) {
    normalStatus.reblog = status.reblog.id;
  }

  // Only calculate these values when status first encountered
  // Otherwise keep the ones already in the reducer
  if (normalOldStatus) {
    normalStatus.search_index = normalOldStatus.get('search_index');
    normalStatus.contentHtml = normalOldStatus.get('contentHtml');
    normalStatus.spoilerHtml = normalOldStatus.get('spoilerHtml');
    normalStatus.hidden = normalOldStatus.get('hidden');
  } else {
    const searchContent = [status.spoiler_text, status.content].join('\n\n').replace(/<br\s*\/?>/g, '\n').replace(/<\/p><p>/g, '\n\n');

    const emojiMap = normalStatus.emojis.reduce((obj, emoji) => {
      obj[`:${emoji.shortcode}:`] = emoji;
      return obj;
    }, {});

    normalStatus.search_index = domParser.parseFromString(searchContent, 'text/html').documentElement.textContent;
    normalStatus.contentHtml  = emojify(normalStatus.content, emojiMap);
    normalStatus.spoilerHtml  = emojify(escapeTextContentForBrowser(normalStatus.spoiler_text || ''), emojiMap);
    normalStatus.hidden       = normalStatus.sensitive;
  }

  return normalStatus;
}
