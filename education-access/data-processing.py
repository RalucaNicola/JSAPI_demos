import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("expected-years-of-schooling.csv")

filtered_df = df[~df["Entity"].isin(['Arab States (UNDP)', 'East Asia and the Pacific (UNDP)',
                             'Europe and Central Asia (UNDP)', 'High human development (UNDP)',
                             'Latin America and the Caribbean (UNDP)', 'Low human development (UNDP)',
                             'Medium human development (UNDP)', 'Micronesia (country)', 'South Asia (UNDP)',
                             'Sub-Saharan Africa (UNDP)', 'Very high human development (UNDP)', 'World'])]
pivoted_years_df = filtered_df.pivot(columns="Year", values="Expected Years of Schooling", index="Entity")
selected_years_df = pivoted_years_df[[1990, 2020]]
#print(selected_years_df[selected_years_df[1990].isna()])
selected_years_df.to_csv("years-of-schooling-histogram.csv", na_rep="null")

# selected_years_df[[1990, 2020]].plot.hist(bins=23, alpha=0.5)
# plt.show()


