import pandas as pd
import json

# location of the count sensors: https://www.stadt-zuerich.ch/geodaten/download/Standorte_der_automatischen_Fuss__und_Velozaehlungen
# prepare locations - remove unnecessary attributes, remove duplicates, export simple json
f = open("locations.geojson")
locations = json.load(f)
output = {"features": []}
uniqueId = []
for i in locations["features"]:
    id = i["properties"]["fk_zaehler"]
    if (id not in uniqueId):
        uniqueId.append(id)
        output["features"].append({
            "geometry": i["geometry"],
            "fk_zaehler": i["properties"]["fk_zaehler"]
        })
print(output)
with open('locations.json', 'w') as outfile:
    json.dump(output, outfile)


# Picked 08th of August 2019 because of Saechseluete parade: https://www.sechselaeuten.ch/de/das-fest/saechsiluete-2019/montag--8042019
# data is downloaded from: https://data.stadt-zuerich.ch/dataset/ted_taz_verkehrszaehlungen_werte_fussgaenger_velo
# prepare time data and filter out attributes

df = pd.read_csv("2019_zurich.csv")
df.fillna(value=0, inplace=True)
df['DATE'] = pd.to_datetime(df['DATUM'])
selected_date_df = df.loc[(df['DATE'] >= pd.Timestamp(2019, 4, 8)) & (df['DATE'] < pd.Timestamp(2019, 4, 9))]
selected_date_filtered_df = selected_date_df[["FK_ZAEHLER", "DATE", "VELO_IN", "VELO_OUT", "FUSS_IN", "FUSS_OUT"]]
selected_date_filtered_df.to_csv("2019_04_08_zurich.csv")