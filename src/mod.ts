import { DependencyContainer } from "tsyringe";

// SPT types
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ImageRouter } from "@spt-aki/routers/ImageRouter";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ITraderConfig } from "@spt-aki/models/spt/config/ITraderConfig";
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";

// New trader settings
import * as baseJson from "../db/base.json";
import * as assortJson from "../db/assort.json";

import { TraderHelper } from "./Trader/Scarlet";
import { AssortUtils as FluentAssortCreator } from "./Utils/AssortUtils";
import { Traders } from "@spt-aki/models/enums/Traders";
import { HashUtil } from "@spt-aki/utils/HashUtil";

class ScarletTrader implements IPreAkiLoadMod, IPostDBLoadMod 
{
    private mod: string;
    private logger: ILogger;
    private traderHelper: TraderHelper;
    private fluentAssortCreator: FluentAssortCreator;

    constructor() 
    {
        this.mod = "Scarlet"; // Set name of mod so we can log it to console later
    }

    /**
   * Some work needs to be done prior to SPT code being loaded, registering the profile image + setting trader update time inside the trader config json
   * @param container Dependency container
   */
    public preAkiLoad(container: DependencyContainer): void 
    {
    // Get a logger
        this.logger = container.resolve<ILogger>("WinstonLogger");
        this.logger.debug(`[${this.mod}] preAki Loading... `);

        // Get SPT code/data we need later
        const preAkiModLoader: PreAkiModLoader =
      container.resolve<PreAkiModLoader>("PreAkiModLoader");
        const imageRouter: ImageRouter =
      container.resolve<ImageRouter>("ImageRouter");
        const hashUtil: HashUtil = container.resolve<HashUtil>("HashUtil");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const traderConfig: ITraderConfig = configServer.getConfig<ITraderConfig>(
            ConfigTypes.TRADER
        );
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(
            ConfigTypes.RAGFAIR
        );

        // Create helper class and use it to register our traders image/icon + set its stock refresh time
        this.traderHelper = new TraderHelper();
        this.fluentAssortCreator = new FluentAssortCreator(hashUtil, this.logger);
        this.traderHelper.registerProfileImage(
            baseJson,
            this.mod,
            preAkiModLoader,
            imageRouter,
            "scarlet.jpg"
        );
        this.traderHelper.setTraderUpdateTime(traderConfig, baseJson, 3600, 4000);

        // Add trader to trader enum
        Traders[baseJson._id] = baseJson._id;

        // Add trader to flea market
        ragfairConfig.traders[baseJson._id] = true;

        this.logger.debug(`[${this.mod}] preAki Loaded`);
    }

    /**
   * Majority of trader-related work occurs after the aki database has been loaded but prior to SPT code being run
   * @param container Dependency container
   */
    public postDBLoad(container: DependencyContainer): void 
    {
        this.logger.debug(`[${this.mod}] postDb Loading... `);

        // Resolve SPT classes we'll use
        const databaseServer: DatabaseServer =
      container.resolve<DatabaseServer>("DatabaseServer");
        const configServer: ConfigServer =
      container.resolve<ConfigServer>("ConfigServer");
        const jsonUtil: JsonUtil = container.resolve<JsonUtil>("JsonUtil");

        // Get a reference to the database tables
        const tables = databaseServer.getTables();

        // Add new trader to the trader dictionary in DatabaseServer - has no assorts (items) yet
        this.traderHelper.addTraderToDb(baseJson, assortJson, tables, jsonUtil);

        // Add trader to locale file, ensures trader text shows properly on screen
        // WARNING: adds the same text to ALL locales (e.g. chinese/french/english)
        this.traderHelper.addTraderToLocales(
            baseJson,
            tables,
            baseJson.name,
            "Scarlet",
            baseJson.nickname,
            baseJson.location,
            "A former TerraGroup Labs employee, highly skilled marksman that sells her services to the most wealthy of Tarkov."
        );

        this.logger.debug(`[${this.mod}] postDb Loaded`);
        this.logger.logWithColor("Scarlet trader has arrived.", LogTextColor.CYAN);
    }
}

module.exports = { mod: new ScarletTrader() };
