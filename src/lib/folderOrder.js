export const ORDER_STEP = 1024;
export const ROOT_KEY = '__root__';

const compareFolderNames = (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

export const resolveSiblingSortOrders = (folders) => {
  const legacyFolders = folders
    .filter((folder) => typeof folder.sortOrder !== 'number')
    .sort(compareFolderNames);

  const legacyOrderById = new Map(
    legacyFolders.map((folder, index) => [folder.id, index * ORDER_STEP])
  );

  return folders.map((folder) => ({
    ...folder,
    sortOrder:
      typeof folder.sortOrder === 'number' ? folder.sortOrder : legacyOrderById.get(folder.id) ?? 0,
  }));
};

export const buildChildrenByParent = (folders) => {
  const resolvedFolders = resolveSiblingSortOrders(folders);
  const childrenByParent = new Map();

  for (const folder of resolvedFolders) {
    const key = folder.parentId ?? ROOT_KEY;
    if (!childrenByParent.has(key)) {
      childrenByParent.set(key, []);
    }
    childrenByParent.get(key).push(folder);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => a.sortOrder - b.sortOrder || compareFolderNames(a, b));
  }

  return childrenByParent;
};

export const orderFoldersForDisplay = (folders) => {
  const childrenByParent = buildChildrenByParent(folders);
  const ordered = [];

  const visit = (parentId) => {
    const key = parentId ?? ROOT_KEY;
    const siblings = childrenByParent.get(key) ?? [];
    for (const folder of siblings) {
      ordered.push(folder);
      visit(folder.id);
    }
  };

  visit(null);

  return ordered;
};

export const getNextFolderSortOrder = (folders, parentId) => {
  const siblings = resolveSiblingSortOrders(folders).filter((folder) => folder.parentId === parentId);
  if (siblings.length === 0) {
    return 0;
  }

  const maxSortOrder = Math.max(...siblings.map((folder) => folder.sortOrder ?? 0));
  return maxSortOrder + ORDER_STEP;
};

export const getAncestorFolderIds = (folders, folderId) => {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const ancestors = [];

  let currentFolder = folderById.get(folderId) ?? null;
  while (currentFolder?.parentId) {
    ancestors.push(currentFolder.parentId);
    currentFolder = folderById.get(currentFolder.parentId) ?? null;
  }

  return ancestors;
};

export const reorderSiblings = (folders, parentId, orderedFolderIds) => {
  const orderedIdSet = new Set(orderedFolderIds);
  const reorderedSiblings = orderedFolderIds.map((folderId, index) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) {
      return null;
    }

    return {
      ...folder,
      sortOrder: index * ORDER_STEP,
    };
  }).filter(Boolean);

  const untouchedFolders = folders.filter(
    (folder) => folder.parentId !== parentId || !orderedIdSet.has(folder.id)
  );

  return [...untouchedFolders, ...reorderedSiblings];
};
