import (
	"sync"
	"sync/atomic"
)

func Test(t *testing.T) {
	want := []string{"main stage", "dance tent", "food court", "first aid", "lost children"}
	var loads atomic.Int32
	release := make(chan struct{})
	siteMap := lazySiteMap(func() []string {
		loads.Add(1)
		<-release // the download is slow: everybody asks before it finishes
		return want
	})
	check.Equal(loads.Load(), int32(0), "how many times load ran before anybody asked for the map")

	// Twenty tablets ask for the map at the same moment.
	got := make([][]string, 20)
	var wg sync.WaitGroup
	for i := range got {
		wg.Go(func() {
			got[i] = siteMap()
		})
	}
	close(release)
	wg.Wait()

	check.Equal(loads.Load(), int32(1), "how many times load ran when twenty tablets asked at once")
	for _, m := range got {
		check.Equal(m, want, "the map every tablet received")
	}
	check.Equal(siteMap(), want, "the map from a later call")
	check.Equal(loads.Load(), int32(1), "how many times load ran after a later call")

	// Two lazy maps are independent.
	var firstLoads, secondLoads atomic.Int32
	first := lazySiteMap(func() []string { firstLoads.Add(1); return []string{"car park A"} })
	second := lazySiteMap(func() []string { secondLoads.Add(1); return []string{"car park B"} })
	check.Equal(second(), []string{"car park B"}, "the map from a second lazySiteMap")
	check.Equal(first(), []string{"car park A"}, "the map from a first lazySiteMap, used after the second")
	check.Equal(firstLoads.Load()+secondLoads.Load(), int32(2), "how many loads two separate lazy maps make")
}
