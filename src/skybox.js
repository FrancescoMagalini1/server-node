import ajv from "./config/ajv.js";

let cache = new Map();

const createSchema = {
  type: "object",
  properties: {
    prompt: {
      type: "string",
    },
  },
  required: ["prompt"],
  additionalProperties: false,
};

const createValidate = ajv.compile(createSchema);

/**
 * Create Skybox function.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function createSkybox(req, res) {
  let data = req.body;
  let valid = createValidate(data);
  if (!valid) {
    res.status(400).end();
    return;
  }
  try {
    let request = await fetch(
      "https://backend.blockadelabs.com/api/v1/skybox",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.SKYBOX_API_KEY,
        },
        body: JSON.stringify({
          skybox_style_id: 119,
          prompt: data.prompt,
          webhook_url: "http:/109.205.183.140:8083/v1/webhook/create",
        }),
      }
    );
    let response = await request.json();
    if (response.error) {
      res.status(400).end();
      return;
    }
    let obj = {
      id: String(response.id),
      obfuscated_id: response.obfuscated_id,
      title: response.title,
      prompt: response.prompt,
      status: "generation " + response.status,
      thumbnail_url: "",
      hdr_url: "",
    };
    cache.set(String(response.obfuscated_id), obj);
    res.status(200).json(obj);
  } catch (error) {
    console.log(error);
    res.status(500).end();
  }
}

/**
 * Get Skybox Status function.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
function getSkyboxStatus(req, res) {
  let id = req.params.id;
  if (!id) {
    res.status(404).end();
    return;
  }
  if (cache.has(id)) {
    res.status(200).json(cache.get(id));
  } else {
    res.status(404).end();
  }
}

/**
 * After creation webhook function.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function afterCreateWebhook(req, res) {
  let data = req.body;
  let id = data.obfuscated_id;
  if (cache.has(id)) {
    let obj = cache.get(id);
    obj.status = data.status;
    obj.thumbnail_url = data.file_url;
  }
  if (data.status == "complete") {
    try {
      let request = await fetch(
        "https://backend.blockadelabs.com/api/v1/skybox/export",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.SKYBOX_API_KEY,
          },
          body: JSON.stringify({
            skybox_id: id,
            type_id: 4,
            webhook_url: "http:/109.205.183.140:8083/v1/webhook/export",
          }),
        }
      );
    } catch (error) {
      console.log(error);
      res.status(500).end();
    }
  }
  res.status(200).end();
}

/**
 * After export webhook function.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
async function afterExportWebhook(req, res) {
  let data = req.body;
  let id = data.skybox_obfuscated_id;
  if (cache.has(id)) {
    let obj = cache.get(id);
    obj.status = "exporting" + data.status;
    obj.hdr_url = data.file_url;
  }
  res.status(200).end();
}

export {
  createSkybox,
  getSkyboxStatus,
  afterCreateWebhook,
  afterExportWebhook,
};
