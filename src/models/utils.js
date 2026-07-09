const fs = require("fs");
const path = require("path");

const repoCompany = require("../repositories/company");
const repoBots = require("../repositories/bots");
const repoFilemanager = require("../repositories/fileManager");
const { geminiEmbedding } = require("../utils/geminiEmbedding");
const { saveEmbeddingToPinecone } = require("./pinecone");

const getIncludedMethods = (fileContent) => {
  const includesMatch = fileContent.match(/@includes\s+([\w,\s]+)/);
  return includesMatch
    ? includesMatch[1].split(",").map((method) => method.trim().toUpperCase())
    : [];
};

const generatePermissions = (routeName, methods) => {
  const routeNameFormatted = routeName.startsWith("/")
    ? routeName.substring(1)
    : routeName;

  const routeParts = routeNameFormatted.split("/");
  const baseRoute = routeParts[0];
  const subRoute = routeParts.slice(1).join(":");

  const methodsString = Array.isArray(methods) ? methods.join(", ") : methods;

  return methodsString.split(", ").map((method) => {
    const actionDescription =
      {
        POST: "create",
        PUT: "update",
        DELETE: "delete",
        GET: "retrieve",
      }[method.toUpperCase()] || method.toLowerCase();

    const permission = `${baseRoute}:${subRoute}:${method.toLowerCase()}`;
    const description = `Allows the user to ${actionDescription} ${subRoute ? `${subRoute.replace(/:/g, " ")}` : baseRoute
    }`;

    return { permission, description };
  });
};

const addRouteToLoadedRoutes = (
  loadedRoutes,
  routeName,
  fullPath,
  methods,
  extensions
) => {
  const existingRoute = loadedRoutes.find(
    (r) => Object.keys(r)[0] === routeName
  );

  const permissions = generatePermissions(fullPath, methods);

  if (existingRoute) {
    existingRoute[routeName].push({
      path: fullPath,
      method: methods,
      extensions,
      permissions: permissions.map((p) => p.permission),
      descriptions: permissions.map((p) => p.description),
    });
  } else {
    loadedRoutes.push({
      [routeName]: [
        {
          path: fullPath,
          method: methods,
          extensions,
          permissions: permissions.map((p) => p.permission),
          descriptions: permissions.map((p) => p.description),
        },
      ],
    });
  }
};

const getEndpointsByField = async (endpoint, extensionsKeys) => {
  try {
    const loadedRoutes = [];
    const directory = path.join(__dirname, "../routes");  

    fs.readdirSync(directory).forEach((file) => {
      if (file.endsWith(".js") && file !== "index.js") {
        const filePath = path.join(directory, file);
        const fileContent = fs.readFileSync(filePath, "utf8");

        const dontListIndex = fileContent.indexOf("@dontList");
        const includedMethods = getIncludedMethods(fileContent);

        const route = require(filePath);
        const routeName = `/${file.replace(".js", "").toLowerCase()}`;
        const shouldSkipRoute = dontListIndex !== -1;

        const extensionMatch = fileContent.match(/@extensions\s+\[(.*?)\]/);
        const routeExtensions = extensionMatch
          ? extensionMatch[1]
            .split(",")
            .map((ext) => ext.trim().replace(/["'[\]]/g, ""))
          : [];

        const hasMatchingExtension =
          routeExtensions.length === 0 ||
          extensionsKeys.some((installedExtension) =>
            routeExtensions.includes(installedExtension)
          );

        if (route.stack && hasMatchingExtension) {
          route.stack.forEach((layer) => {
            if (layer.route) {
              const fullPath = routeName + layer.route.path;
              const methods = Object.keys(layer.route.methods)
                .map((m) => m.toUpperCase())
                .join(", ");

              if (
                includedMethods.length > 0 &&
                fileContent.indexOf(layer.route.path) > dontListIndex
              ) {
                addRouteToLoadedRoutes(
                  loadedRoutes,
                  routeName,
                  fullPath,
                  includedMethods,
                  routeExtensions
                );
              }

              if (
                shouldSkipRoute &&
                fileContent.indexOf(layer.route.path) > dontListIndex
              ) {
                return;
              }

              addRouteToLoadedRoutes(
                loadedRoutes,
                routeName,
                fullPath,
                methods,
                routeExtensions
              );
            }
          });
        }
      }
    });

    const filteredRoutes = endpoint
      ? loadedRoutes.filter((route) => {
        const routeName = Object.keys(route)[0];
        return routeName.includes(endpoint.toLowerCase());
      })
      : loadedRoutes;

    return filteredRoutes;
  } catch (error) {
    throw new Error(`Error loading routes: ${error.message}`);
  }
};

const createAndStoreEmbedding = async (query, body) => {
  try {
    await validateQueryParams(query);

    const { companyID, botID, fileID } = query;

    const { text, chunknumber, extraMetadata } = body;

    const vectors = await geminiEmbedding(
      text,
      { id: `${fileID}:chunk:${chunknumber}`, fileID: fileID, chunknumber: chunknumber, ...extraMetadata },
      companyID,
      botID
    );

    const response = await saveEmbeddingToPinecone(
      { companyID, botID, fileID, extraMetadata },
      { payload: vectors }
    );

    if (response) return true;
  } catch (error) {
    throw new Error(`Error creating and storing embedding: ${error.message}`);
  }
};

const validateQueryParams = async ({ companyID, botID, fileID }) => {
  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw new Error(`Company with UUID '${companyID}' not found.`);
  }

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });

  if (!botField) {
    throw new Error(`Bot with UUID '${botID}' not found.`);
  }

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.identificator": fileID,
    "filemanager_files.company_id": companyID,
  });

  if (!fileField) {
    throw new Error(`File with UUID '${fileID}' not found.`);
  }
};

module.exports = { getEndpointsByField, createAndStoreEmbedding };
