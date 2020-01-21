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

data %>%
  filter(ANON_ID %in% ids) %>%
  mutate(subject = as.factor(ANON_ID)) %>%
  ggplot(aes(x = age_years, y = temp_C, color = subject)) +
  geom_line() +
  theme(legend.position = "none")
# each individual seems to have his/her own median temperature


# calculate all median temperatures
data %>%
  group_by(ANON_ID) %>%
  summarise(median_temp_C = median(temp_C),
            median_weight = median(weight_KG),
            median_height = median(height_CM),
            sex = unique(GENDER),
            n = length(ANON_ID)) -> median_plot_data

median_plot_data %>%
  filter(n > 10) %>%
  ggplot(aes(x = as.factor(ANON_ID), y = median_temp_C, color = median_height, size = median_weight, shape = sex)) +
  scale_color_viridis_c() +
  geom_point(alpha = 0.5) +
  scale_size_continuous(range = c(0.5, 5)) +
  theme(axis.text.x = element_blank(), axis.ticks = element_blank(), axis.title.x = element_blank())

# the median plot with NA diagnoses only
data %>%
  filter(is.na(primary_dx)) %>%
  group_by(ANON_ID) %>%
  summarise(median_temp_C = median(temp_C, na.rm = TRUE),
            median_weight = median(weight_KG, na.rm = TRUE),
            median_height = median(height_CM, na.rm = TRUE),
            sex = unique(GENDER),
            n = length(ANON_ID)) %>%
  filter(n > 1) -> median_plot_data_healthy

median_plot_data_healthy %>%
  ggplot(aes(x = as.factor(ANON_ID), y = median_temp_C, color = median_height, size = median_weight, shape = sex)) +
  scale_color_viridis_c() +
  geom_point(alpha = 0.5) +
  scale_size_continuous(range = c(0.5, 5)) +
  theme(axis.text.x = element_blank(), axis.ticks = element_blank(), axis.title.x = element_blank())

# what primary diagnoses are there?
data %>%
  filter(!is.na(primary_dx)) %>%
  group_by(primary_dx) %>%
  summarise(n = length(primary_dx)) %>%
  arrange(desc(n)) -> diagnoses

# do these diagnoses have an effect on temperature?
data %>%
  filter(grepl(paste(diagnoses$primary_dx[1:10], collapse = "|"), primary_dx) | is.na(primary_dx)) %>%
  filter(ANON_ID %in% median_plot_data$ANON_ID) %>%
  ggplot(aes(x = as.factor(ANON_ID), y = temp_C, color = as.factor(primary_dx))) +
  geom_point(alpha = 0.5) +
  theme(axis.text.x = element_blank(), axis.ticks = element_blank(), axis.title.x = element_blank())


# try to fit a model on the most common diagnosesxw
data %>%
  filter(grepl(paste(diagnoses$primary_dx[1:10], collapse = "|"), primary_dx) | is.na(primary_dx)) %>%
  mutate(primary_dx = if_else(is.na(primary_dx), "none", primary_dx)) %>%
  mutate(primary_dx = as.factor(primary_dx)) -> fit_data

model <- lm(temp_C ~ primary_dx, data = fit_data)
summary(model)

# diagnoses with an effect > 0.2
large_effect_dx <- model$coefficients[abs(model$coefficients) > 0.2][-1] %>%
  names() %>%
  gsub("primary_dx", "", .)

# plot them
data %>%
  filter(primary_dx %in% c(large_effect_dx) | is.na(primary_dx)) %>%
  ggplot(aes(x = as.factor(ANON_ID), y = temp_C, color = as.factor(primary_dx))) +
  geom_point(alpha = 0.5) +
  theme(axis.text.x = element_blank(), axis.ticks = element_blank(), axis.title.x = element_blank())

# compare healthy with all
data %>%
  mutate(healthy = if_else(is.na(primary_dx), "yes", "no")) %>%
  mutate(healthy = if_else(primary_dx %in% large_effect_dx, "high_risk", healthy)) %>%
  ggplot(aes(temp_C, group = healthy, color = healthy)) +
  geom_density()

# replot the medians and exclude the high risk diagnoses
data %>%
  filter(!primary_dx %in% large_effect_dx) %>%
  group_by(ANON_ID) %>%
  summarise(median_temp_C = median(temp_C),
            median_weight = median(weight_KG),
            median_height = median(height_CM),
            sex = unique(GENDER),
            n = length(ANON_ID)) -> median_plot_data

median_plot_data %>%
  filter(n > 10) %>%
  ggplot(aes(x = as.factor(ANON_ID), y = median_temp_C, color = median_height, size = median_weight, shape = sex)) +
  scale_color_viridis_c() +
  geom_point(alpha = 0.5) +
  scale_size_continuous(range = c(0.5, 5)) +
  theme(axis.text.x = element_blank(), axis.ticks = element_blank(), axis.title.x = element_blank())
