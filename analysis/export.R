library(tidyverse)

# load STRIDE data
data <- read_csv(file = file.path("data", "STRIDE_processed.csv"))

# check the numbers of measurement per individual
data %>%
  group_by(ANON_ID) %>%
  summarise(n = length(ANON_ID)) %>%
  arrange(desc(n)) -> num_measurements


# plot temperature for individuals
ids <- num_measurements$ANON_ID[c(1:5, 7, 11, 14, 18)]
ids <- num_measurements$ANON_ID[1:20]

data %>%
  filter(ANON_ID %in% ids) %>%
  select(ANON_ID, age_years, temp_C, primary_dx, GENDER) -> data_export

# write to file
write_csv(x = data_export,
          path = file.path("..", "app", "public", "data.csv"))
